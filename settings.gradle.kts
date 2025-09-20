rootProject.name = "tabby-elide"

include(
    "control-plane:app",
    "control-plane:modules:auth-google",
    "control-plane:modules:release",
    "control-plane:modules:admin-ui"
)
