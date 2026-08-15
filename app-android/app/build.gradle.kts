import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    // Nome de pacote em português de propósito: ele aparece para a usuária
    // em Ajustes > Apps, e ali o disfarce vale mais que a convenção de código.
    namespace = "br.com.calculadora.simples"
    compileSdk = 36
    buildToolsVersion = "36.0.0"

    defaultConfig {
        applicationId = "br.com.calculadora.simples"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        // Corta o APK pela metade. Nenhum aparelho relevante de 2026 é 32 bits.
        ndk { abiFilters += listOf("arm64-v8a") }

        // Trocável sem editar código:  ./gradlew assembleDebug -PserverUrl=https://...
        // Refazer o APK só para mudar de servidor é como se perde a demo.
        buildConfigField(
            "String",
            "SERVER_URL",
            "\"${project.findProperty("serverUrl") ?: "http://192.168.1.50:3000"}\""
        )
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    // Os arquivos do modelo ficam comprimidos no APK de propósito: são copiados
    // para o armazenamento privado por stream antes de serem abertos, então o
    // Vosk nunca faz mmap direto do asset. Comprimir corta ~20 MB do download,
    // o que importa quando o APK é baixado na rede do evento.

    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
}

kotlin {
    compilerOptions { jvmTarget.set(JvmTarget.JVM_17) }
}

dependencies {
    implementation("androidx.core:core-ktx:1.17.0")
    implementation("androidx.activity:activity-compose:1.11.0")
    implementation(platform("androidx.compose:compose-bom:2026.01.01"))
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.9.4")
    implementation("com.google.android.gms:play-services-location:21.4.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // Reconhecimento de voz offline. O sufixo @aar é obrigatório nos dois, e o
    // JNA não vem como dependência transitiva do Vosk — declarar os dois é o
    // que evita UnsatisfiedLinkError em tempo de execução.
    implementation("com.alphacephei:vosk-android:0.3.47@aar")
    implementation("net.java.dev.jna:jna:5.13.0@aar")
}
