package work.tabby.controlplane.release

import io.ktor.http.ContentType
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.security.KeyPair
import java.security.MessageDigest
import java.security.Signature
import java.util.Base64

fun Route.registerReleaseRoutes(jwk: Map<String, String>, keyPair: KeyPair) {
    // Dev payload served locally so the extension can fetch it without external CDN
    get("/dev/payload.json") {
        val tenant = call.request.queryParameters["tenant"] ?: "dev"
        call.respondText(minimalPayloadJson(tenant), ContentType.Application.Json)
    }

    route("/api/v1") {
        get("/releases/{tenant}/latest") {
            val tenant = call.parameters["tenant"] ?: "default"
            val payloadJson = minimalPayloadJson(tenant)
            val payloadBytes = payloadJson.toByteArray(Charsets.UTF_8)

            // Compute SHA-256 of payload
            val digest = MessageDigest.getInstance("SHA-256").digest(payloadBytes)
            val sha256Hex = digest.joinToString(separator = "") { b -> "%02x".format(b) }
            val etag = "W/\"${sha256Hex.take(12)}\""

            // Sign raw payload bytes (RS256 over raw); client will verify over raw bytes
            val signer = Signature.getInstance("SHA256withRSA").apply {
                initSign(keyPair.private)
                update(payloadBytes)
            }
            val sigB64Url = Base64.getUrlEncoder().withoutPadding().encodeToString(signer.sign())

            val resp = mapOf(
                "version" to "2025.09.19.001",
                "etag" to etag,
                "sha256" to sha256Hex,
                "sig" to mapOf(
                    "alg" to (jwk["alg"] ?: "RS256"),
                    "kid" to (jwk["kid"] ?: "dev-ephemeral"),
                    "input" to "raw",
                    "value" to sigB64Url
                ),
                // Local dev payload
                "payload_url" to "/dev/payload.json?tenant=$tenant"
            )
            call.respond(resp)
        }
    }
}

private fun minimalPayloadJson(tenant: String): String = """
{
  "tenant": "$tenant",
  "version": "2025.09.19.001",
  "theme": { "logoUrl": "", "primary": "#0EA5E9", "font": "Inter" },
  "pages": [
    {
      "route": "/",
      "sections": [
        {
          "kind": "grid",
          "tiles": [
            { "type": "announcement", "title": "All-hands 10 AM", "body": "Town Hall in Auditorium A" },
            { "type": "link", "label": "HR Portal", "url": "https://example.com/hr" },
            { "type": "app", "label": "Jira", "url": "https://jira.example.com", "sso": "saml" }
          ]
        }
      ]
    }
  ],
  "audiences": [],
  "flags": { "search": false }
}
""".trimIndent()

