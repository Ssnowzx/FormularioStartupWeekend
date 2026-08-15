package br.com.calculadora.simples

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Looper
import android.util.Log
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import java.time.Instant

private const val TAG = "calc"
private const val INTERVAL_MS = 15_000L

/**
 * Positions during an active alert, and only during an active alert.
 *
 * There is no continuous tracking in this product. Nothing here runs until a
 * trigger fires, which is why the database has no place to put a position
 * that is not attached to an occurrence.
 */
class LocationTracker(private val context: Context) {

    private val fused = runCatching { LocationServices.getFusedLocationProviderClient(context) }.getOrNull()
    private var fusedCallback: LocationCallback? = null
    private var systemListener: LocationListener? = null

    private val hasPlayServices: Boolean
        get() = GoogleApiAvailability.getInstance()
            .isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS

    /** Best position already cached, used to fire the alert without waiting for a fix. */
    @SuppressLint("MissingPermission")
    fun lastKnown(): Position? = runCatching {
        val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        listOfNotNull(
            manager.getLastKnownLocation(LocationManager.GPS_PROVIDER),
            manager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
        ).maxByOrNull { it.time }?.toPosition()
    }.getOrNull()

    @SuppressLint("MissingPermission")
    fun start(onPosition: (Position) -> Unit) {
        stop()
        // Google Play Services is on effectively every Brazilian handset, but
        // the plain LocationManager fallback costs twenty lines and removes a
        // single point of failure from an emergency path.
        if (hasPlayServices && fused != null) startFused(onPosition) else startSystem(onPosition)
    }

    @SuppressLint("MissingPermission")
    private fun startFused(onPosition: (Position) -> Unit) {
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, INTERVAL_MS)
            .setMinUpdateIntervalMillis(5_000L)
            .setWaitForAccurateLocation(false)
            .build()
        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { onPosition(it.toPosition()) }
            }
        }
        fusedCallback = callback
        runCatching { fused?.requestLocationUpdates(request, callback, Looper.getMainLooper()) }
            .onFailure { Log.w(TAG, "fused indisponível, caindo para o LocationManager"); startSystem(onPosition) }
    }

    @SuppressLint("MissingPermission")
    private fun startSystem(onPosition: (Position) -> Unit) {
        val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        val listener = LocationListener { location -> onPosition(location.toPosition()) }
        systemListener = listener
        for (provider in listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)) {
            runCatching {
                if (manager.isProviderEnabled(provider)) {
                    manager.requestLocationUpdates(provider, INTERVAL_MS, 5f, listener, Looper.getMainLooper())
                }
            }
        }
    }

    fun stop() {
        fusedCallback?.let { runCatching { fused?.removeLocationUpdates(it) } }
        fusedCallback = null
        systemListener?.let { listener ->
            runCatching {
                (context.getSystemService(Context.LOCATION_SERVICE) as LocationManager)
                    .removeUpdates(listener)
            }
        }
        systemListener = null
    }
}

private fun Location.toPosition() = Position(
    lat = latitude,
    lng = longitude,
    accuracyMeters = accuracy.toInt(),
    source = if (provider == LocationManager.NETWORK_PROVIDER) "network" else "gps",
    recordedAt = Instant.ofEpochMilli(time).toString()
)
