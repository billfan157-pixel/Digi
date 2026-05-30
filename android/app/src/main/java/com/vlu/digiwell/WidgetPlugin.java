package com.vlu.digiwell;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetPlugin")
public class WidgetPlugin extends Plugin {

    @PluginMethod
    public void syncData(PluginCall call) {
        int waterToday = call.getInt("water_today", 0);
        int waterGoal = call.getInt("water_goal", 2000);
        String themeColor = call.getString("themeColor", "#06b6d4");

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences("CapacitorPreferences", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString("digiwell_widget_data", "{\"waterToday\":" + waterToday + ",\"waterGoal\":" + waterGoal + ",\"themeColor\":\"" + themeColor + "\"}");
        editor.apply();

        // Force widget update immediately
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        ComponentName widgetProvider = new ComponentName(context, DigiWellWidgetProvider.class);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(widgetProvider);
        if (appWidgetIds.length > 0) {
            DigiWellWidgetProvider widgetProviderInstance = new DigiWellWidgetProvider();
            widgetProviderInstance.onUpdate(context, appWidgetManager, appWidgetIds);
        }

        call.resolve();
    }
}
