package de.felicedesign.grocerytracker;

import android.Manifest;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

// Schreibt eine Textdatei direkt und ohne Auswahldialog in den öffentlichen
// Downloads-Ordner. Ab Android 10 (API 29) über die MediaStore-API (kein
// Berechtigungsbedarf, Scoped-Storage-konform) – der direkte Datei-Zugriff,
// den @capacitor/filesystem für Directory.Documents/Downloads nutzt, wird
// vom System auf Android 11+ grundsätzlich blockiert. Auf älteren Versionen
// (<API 29, vor Scoped Storage) über klassischen Datei-Zugriff mit
// WRITE_EXTERNAL_STORAGE.
@CapacitorPlugin(
    name = "DownloadsSaver",
    permissions = { @Permission(strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }, alias = "storage") }
)
public class DownloadsSaverPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        String filename = call.getString("filename");
        String content = call.getString("content");
        if (filename == null || content == null) {
            call.reject("filename und content sind erforderlich");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            saveViaMediaStore(call, filename, content);
            return;
        }

        if (getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "permissionCallback");
            return;
        }
        saveLegacy(call, filename, content);
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (getPermissionState("storage") != PermissionState.GRANTED) {
            call.reject("Berechtigung verweigert");
            return;
        }
        saveLegacy(call, call.getString("filename"), call.getString("content"));
    }

    private void saveViaMediaStore(PluginCall call, String filename, String content) {
        try {
            ContentValues values = new ContentValues();
            values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
            values.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
            values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

            Uri uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri == null) {
                call.reject("Konnte keinen Speicherplatz anlegen");
                return;
            }
            try (OutputStream out = getContext().getContentResolver().openOutputStream(uri)) {
                if (out == null) throw new java.io.IOException("openOutputStream lieferte null");
                out.write(content.getBytes(StandardCharsets.UTF_8));
            }
            JSObject ret = new JSObject();
            ret.put("uri", uri.toString());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Speichern fehlgeschlagen: " + e.getMessage(), e);
        }
    }

    private void saveLegacy(PluginCall call, String filename, String content) {
        try {
            File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (!dir.exists()) dir.mkdirs();
            File file = new File(dir, filename);
            try (FileOutputStream out = new FileOutputStream(file)) {
                out.write(content.getBytes(StandardCharsets.UTF_8));
            }
            JSObject ret = new JSObject();
            ret.put("uri", Uri.fromFile(file).toString());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Speichern fehlgeschlagen: " + e.getMessage(), e);
        }
    }
}
