package work.tabby.controlplane

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import io.ktor.serialization.jackson.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.statuspages.*
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import work.tabby.controlplane.release.registerReleaseRoutes
import work.tabby.controlplane.auth.registerAuthRoutes
import work.tabby.controlplane.admin.registerAdminUiRoutes
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.util.Base64

fun main() {
    // Prefer explicit PORT if provided; otherwise choose the first free port from a low-port list (<8080)
    val explicit = System.getenv("PORT")?.toIntOrNull()
    val candidates = listOf(7777, 7070, 7007, 6502, 6123, 5555, 5234, 5005, 4321, 3456, 2345, 1234)
    val port = explicit ?: run {
        var chosen: Int? = null
        for (p in candidates) {
            try {
                java.net.ServerSocket(p).use { /* if we can bind, it's free */ }
                chosen = p
                break
            } catch (_: Exception) {
                // try next
            }
        }
        (chosen ?: 0).also { println("[control-plane] Using port: $it (0 means ephemeral)") }
    }

    // Generate ephemeral dev keypair (replace with KMS-managed keys in prod)
    val keyPair: KeyPair = KeyPairGenerator.getInstance("RSA").apply { initialize(2048) }.generateKeyPair()
    val jwk = jwkFromKeyPair(keyPair)

    embeddedServer(Netty, port = port) {
        install(StatusPages) {
            exception<Throwable> { call, cause ->
                cause.printStackTrace()
                call.respond(HttpStatusCode.InternalServerError, mapOf("error" to (cause.message ?: "unknown")))
            }
        }
        install(CORS) {
            anyHost()
            allowMethod(HttpMethod.Options)
            allowMethod(HttpMethod.Get)
            allowHeader(HttpHeaders.ContentType)
            allowHeader(HttpHeaders.Authorization)
            allowHeader(HttpHeaders.IfNoneMatch)
            allowHeader(HttpHeaders.ETag)
        }
        install(ContentNegotiation) {
            jackson {
                registerKotlinModule()
                disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            }
        }

        routing {
            get("/.well-known/tabby/keys.json") { call.respond(mapOf("keys" to listOf(jwk))) }
            get("/healthz") { call.respondText("ok") }
            registerAuthRoutes()
            registerReleaseRoutes(jwk, keyPair)
            registerAdminUiRoutes()
        }
    }.start(wait = true)
}

private fun jwkFromKeyPair(kp: KeyPair): Map<String, String> {
    val public = kp.public.encoded
    val n = Base64.getUrlEncoder().withoutPadding().encodeToString(public)
    return mapOf(
        "kty" to "RSA",
        "alg" to "RS256",
        "use" to "sig",
        "kid" to "dev-ephemeral",
        "n" to n,
        "e" to "AQAB"
    )
}

