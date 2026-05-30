package com.vlu.digiwell

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Color
import android.widget.RemoteViews
import org.json.JSONObject

class DigiWellWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.widget_layout)
        val prefs: SharedPreferences =
            context.getSharedPreferences("CapacitorPreferences", Context.MODE_PRIVATE)
        val raw = prefs.getString("digiwell_widget_data", null)

        val themeColor: Int
        val waterToday: Int
        val waterGoal: Int
        val progress: Int

        if (raw != null) {
            try {
                val data = JSONObject(raw)
                waterToday = data.optInt("waterToday", 0)
                waterGoal = data.optInt("waterGoal", 2000)
                progress = data.optInt("userProgressPercent", 0)
                themeColor = try {
                    Color.parseColor(data.optString("themeColor", "#06B6D4"))
                } catch (_: IllegalArgumentException) {
                    Color.parseColor("#06B6D4")
                }

                views.setTextViewText(
                    R.id.widget_water_text,
                    if (waterToday > 0) "$waterToday / $waterGoal ml" else "-- / -- ml"
                )
            } catch (_: Exception) {
                views.setTextViewText(R.id.widget_water_text, "-- / -- ml")
                themeColor = Color.parseColor("#06B6D4")
                waterToday = 0
                waterGoal = 2000
                progress = 0
            }
        } else {
            views.setTextViewText(R.id.widget_water_text, "-- / -- ml")
            themeColor = Color.parseColor("#06B6D4")
            waterToday = 0
            waterGoal = 2000
            progress = 0
        }

        // Apply dynamic theme color
        views.setTextColor(R.id.widget_title_text, themeColor)
        views.setTextColor(R.id.widget_water_text, themeColor)

        // Progress bar via ClipDrawable on ImageView
        // ClipDrawable level: 0 = empty, 10000 = full
        val clipLevel = (progress.coerceIn(0, 100) * 100).coerceIn(0, 10000)
        views.setInt(R.id.widget_progress_image, "setImageLevel", clipLevel)
        views.setInt(R.id.widget_progress_image, "setColorFilter", themeColor)

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.widget_layout_root, pendingIntent)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
