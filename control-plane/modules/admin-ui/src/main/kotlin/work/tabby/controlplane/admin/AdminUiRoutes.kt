package work.tabby.controlplane.admin

import io.ktor.http.ContentType
import io.ktor.server.application.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.registerAdminUiRoutes() {
    route("/admin") {
        get("/") {
            val html = """
                <!doctype html>
                <html>
                <head><meta charset=\"utf-8\" /><title>Tabby Admin</title></head>
                <body>
                  <h1>Tabby Admin</h1>
                  <p>Basic scaffold. SPA will be built here.</p>
                </body>
                </html>
            """.trimIndent()
            call.respondText(html, ContentType.Text.Html)
        }
    }
}

