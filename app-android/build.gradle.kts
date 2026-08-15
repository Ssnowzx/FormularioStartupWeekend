// Versões fixadas de propósito, não são as mais novas disponíveis.
// AGP 9.x liga android.builtInKotlin por padrão e o plugin
// org.jetbrains.kotlin.android deixa de ser compatível — campo minado
// para quem está montando o projeto à mão, sem Android Studio.
plugins {
    id("com.android.application") version "8.13.2" apply false
    id("org.jetbrains.kotlin.android") version "2.3.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.3.21" apply false
}
