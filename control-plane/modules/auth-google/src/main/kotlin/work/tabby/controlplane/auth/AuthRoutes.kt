package work.tabby.controlplane.auth

import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.registerAuthRoutes() {
    route("/api/v1/admin") {
        post("/oauth/callback") {
            call.respond(mapOf("ok" to true, "note" to "stub oauth callback"))
        }
        get("/tenants/me") {
            call.respond(mapOf("tenant" to "dev", "roles" to listOf("admin")))
        }
    }
}

