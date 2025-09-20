plugins {
    kotlin("jvm") version "1.9.24" apply false

}

allprojects {
    repositories {
        mavenCentral()
        google()
    }
}

subprojects {
    plugins.withId("org.jetbrains.kotlin.jvm") {
                tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
            kotlinOptions.jvmTarget = JavaVersion.VERSION_17.toString()
            kotlinOptions.freeCompilerArgs += listOf("-Xjsr305=strict")
        }
    }
    plugins.withId("java") {
                tasks.withType<JavaCompile>().configureEach {
            sourceCompatibility = JavaVersion.VERSION_17.toString()
            targetCompatibility = JavaVersion.VERSION_17.toString()
        }
    }
}



group = "work.tabby"
version = "1.0-SNAPSHOT"





