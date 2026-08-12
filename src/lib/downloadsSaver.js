import { registerPlugin } from '@capacitor/core';

// Wrapper für das kleine native Plugin (android/.../DownloadsSaverPlugin.java):
// schreibt eine Textdatei direkt und ohne Auswahldialog in den öffentlichen
// Downloads-Ordner (ab Android 10 über MediaStore, kein Berechtigungsbedarf
// und Scoped-Storage-konform – anders als @capacitor/filesystem mit
// Directory.Documents/Downloads, das auf Android 11+ am System scheitert).
export const DownloadsSaver = registerPlugin('DownloadsSaver');
