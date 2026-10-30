import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Upload anahtarı depoda değil: WISHCEO_KEY_PROPERTIES ya da ~/.wishceo/key.properties
// (alanlar: android/key.properties.example). Dosya yoksa release debug imzayla
// derlenir; böyle bir AAB Play'e yüklenemez (README: Android).
val keyFile = System.getenv("WISHCEO_KEY_PROPERTIES")?.let { file(it) }
    ?: file("${System.getProperty("user.home")}/.wishceo/key.properties")
val keyProps = Properties().apply {
    if (keyFile.isFile) FileInputStream(keyFile).use { load(it) }
}
val hasUploadKey = keyProps.getProperty("storeFile") != null

android {
    namespace = "co.saascorner.wishceo"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "co.saascorner.wishceo"
        minSdk = maxOf(24, flutter.minSdkVersion)
        // Play: Ağustos 2026'dan beri yeni uygulamalarda en az 36.
        targetSdk = maxOf(36, flutter.targetSdkVersion)
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (hasUploadKey) {
            create("upload") {
                storeFile = file(keyProps.getProperty("storeFile"))
                storePassword = keyProps.getProperty("storePassword")
                keyAlias = keyProps.getProperty("keyAlias")
                keyPassword = keyProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName(if (hasUploadKey) "upload" else "debug")
        }
    }
}

if (!hasUploadKey) {
    logger.warn("wishceo: upload anahtarı yok, release debug imzalı (Play kabul etmez).")
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
