plugins {
    kotlin("jvm")
    application
}

application {
    mainClass.set("work.tabby.controlplane.AppKt")
}

dependencies {
    val ktor = "2.3.12"
    implementation("io.ktor:ktor-server-netty:$ktor")
    implementation("io.ktor:ktor-server-core:$ktor")
    implementation("io.ktor:ktor-server-status-pages:$ktor")
    implementation("io.ktor:ktor-server-content-negotiation:$ktor")
    implementation("io.ktor:ktor-serialization-jackson:$ktor")
    implementation("io.ktor:ktor-server-cors:$ktor")
    implementation("ch.qos.logback:logback-classic:1.5.7")

    implementation(project(":control-plane:modules:release"))
    implementation(project(":control-plane:modules:auth-google"))
    implementation(project(":control-plane:modules:admin-ui"))
}

