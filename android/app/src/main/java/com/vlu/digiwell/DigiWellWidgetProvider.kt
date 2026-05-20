package com.vlu.digiwell

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
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

        if (raw != null) {
            try {
                val data = JSONObject(raw)
                val waterToday = data.optInt("waterToday", 0)
                val waterGoal = data.optInt("waterGoal", 2000)
                val partnerName = data.optString("partnerName", "")
                val partnerProgress = data.optInt("partnerProgressPercent", 0)

                views.setTextViewText(
                    R.id.widget_water_text,
                    if (waterToday > 0) "$waterToday / $waterGoal ml" else "-- / -- ml"
                )

                views.setProgressBar(R.id.widget_progress_bar, 100, partnerProgress.coerceIn(0, 100), false)
            } catch (_: Exception) {
                views.setTextViewText(R.id.widget_water_text, "-- / -- ml")
            }
        } else {
            views.setTextViewText(R.id.widget_water_text, "-- / -- ml")
        }

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
