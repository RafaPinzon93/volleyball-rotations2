"""Run the JavaScript formation checks with Node, or macOS JavaScriptCore."""
import ctypes
import json
from pathlib import Path
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parent.parent
source = "globalThis.structuredClone = globalThis.structuredClone || (x => JSON.parse(JSON.stringify(x)));\n"
source += (root / "app.js").read_text() + "\n" + (root / "tests/formations.js").read_text()
node = shutil.which("node")
if node:
    subprocess.run([node, "-e", source + "\nconsole.log(testResult);"], check=True)
elif sys.platform == "darwin":
    js = ctypes.CDLL("/System/Library/Frameworks/JavaScriptCore.framework/JavaScriptCore")
    ptr = ctypes.c_void_p
    js.JSGlobalContextCreate.argtypes = [ptr]
    js.JSGlobalContextCreate.restype = ptr
    js.JSStringCreateWithUTF8CString.argtypes = [ctypes.c_char_p]
    js.JSStringCreateWithUTF8CString.restype = ptr
    js.JSEvaluateScript.argtypes = [ptr, ptr, ptr, ptr, ctypes.c_int, ctypes.POINTER(ptr)]
    js.JSEvaluateScript.restype = ptr
    js.JSValueToStringCopy.argtypes = [ptr, ptr, ctypes.POINTER(ptr)]
    js.JSValueToStringCopy.restype = ptr
    js.JSStringGetMaximumUTF8CStringSize.argtypes = [ptr]
    js.JSStringGetMaximumUTF8CStringSize.restype = ctypes.c_size_t
    js.JSStringGetUTF8CString.argtypes = [ptr, ctypes.c_char_p, ctypes.c_size_t]
    js.JSStringGetUTF8CString.restype = ctypes.c_size_t
    context = js.JSGlobalContextCreate(None)
    exception = ptr()
    script = js.JSStringCreateWithUTF8CString((source + "\ntestResult;").encode())
    result = js.JSEvaluateScript(context, script, None, None, 1, ctypes.byref(exception))
    string = js.JSValueToStringCopy(context, exception.value or result, None)
    size = js.JSStringGetMaximumUTF8CStringSize(string)
    buffer = ctypes.create_string_buffer(size)
    js.JSStringGetUTF8CString(string, buffer, size)
    print(buffer.value.decode())
    sys.exit(1 if exception.value else 0)
else:
    sys.exit("Install Node.js to run the formation checks on this platform.")
