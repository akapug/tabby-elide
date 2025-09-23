package work.tabby.controlplane.tasks

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.util.*
import kotlin.io.path.createDirectories
import kotlin.io.path.exists
import kotlin.io.path.readBytes
import kotlin.io.path.writeBytes

private data class Task(
    val id: String,
    val text: String,
    val done: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
)

private val MAPPER = jacksonObjectMapper()

private fun dataDir(): Path {
    val base = System.getenv("TABBY_DATA_DIR") ?: Paths.get(System.getProperty("user.dir"), "build", "data").toString()
    val p = Paths.get(base)
    if (!p.exists()) p.createDirectories()
    return p
}

private fun fileForTenant(tenant: String): Path {
    val p = dataDir().resolve("tasks-$tenant.json")
    if (!p.exists()) Files.write(p, "[]".toByteArray())
    return p
}

private fun readTasks(tenant: String): MutableList<Task> {
    val f = fileForTenant(tenant)
    return try {
        if (!f.exists()) mutableListOf() else MAPPER.readValue(f.readBytes())
    } catch (_: Exception) {
        mutableListOf()
    }
}

private fun writeTasks(tenant: String, tasks: List<Task>) {
    val f = fileForTenant(tenant)
    val bytes = MAPPER.writerWithDefaultPrettyPrinter().writeValueAsBytes(tasks)
    f.writeBytes(bytes)
}

fun Route.registerTaskRoutes() {
    route("/api/v1/tasks") {
        get("/{tenant}") {
            val tenant = call.parameters["tenant"] ?: return@get call.respond(HttpStatusCode.BadRequest)
            val tasks = readTasks(tenant)
            call.respond(mapOf("tasks" to tasks))
        }
        post("/{tenant}") {
            val tenant = call.parameters["tenant"] ?: return@post call.respond(HttpStatusCode.BadRequest)
            val body = runCatching { call.receive<Map<String, Any?>>() }.getOrNull() ?: emptyMap()
            val text = (body["text"] as? String)?.trim().orEmpty()
            if (text.isEmpty()) return@post call.respond(HttpStatusCode.BadRequest, mapOf("error" to "text required"))
            val tasks = readTasks(tenant)
            val task = Task(id = UUID.randomUUID().toString(), text = text)
            tasks.add(0, task)
            writeTasks(tenant, tasks)
            call.respond(task)
        }
        patch("/{tenant}/{id}") {
            val tenant = call.parameters["tenant"] ?: return@patch call.respond(HttpStatusCode.BadRequest)
            val id = call.parameters["id"] ?: return@patch call.respond(HttpStatusCode.BadRequest)
            val body = runCatching { call.receive<Map<String, Any?>>() }.getOrNull() ?: emptyMap()
            val tasks = readTasks(tenant)
            val idx = tasks.indexOfFirst { it.id == id }
            if (idx == -1) return@patch call.respond(HttpStatusCode.NotFound)
            val cur = tasks[idx]
            val updated = cur.copy(
                text = (body["text"] as? String)?.ifBlank { cur.text } ?: cur.text,
                done = (body["done"] as? Boolean) ?: cur.done,
            )
            tasks[idx] = updated
            writeTasks(tenant, tasks)
            call.respond(updated)
        }
        delete("/{tenant}/{id}") {
            val tenant = call.parameters["tenant"] ?: return@delete call.respond(HttpStatusCode.BadRequest)
            val id = call.parameters["id"] ?: return@delete call.respond(HttpStatusCode.BadRequest)
            val tasks = readTasks(tenant)
            val removed = tasks.removeIf { it.id == id }
            if (!removed) return@delete call.respond(HttpStatusCode.NotFound)
            writeTasks(tenant, tasks)
            call.respond(HttpStatusCode.NoContent)
        }
    }
}
