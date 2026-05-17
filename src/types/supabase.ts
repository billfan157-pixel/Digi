export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      active_buffs: {
        Row: {
          buff_type: string | null
          expires_at: string | null
          id: string
          multiplier: number | null
          target_user_id: string | null
        }
        Insert: {
          buff_type?: string | null
          expires_at?: string | null
          id?: string
          multiplier?: number | null
          target_user_id?: string | null
        }
        Update: {
          buff_type?: string | null
          expires_at?: string | null
          id?: string
          multiplier?: number | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          context: Json
          created_at: string
          id: string
          title: string | null
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: string
          title?: string | null
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          id?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_reports: {
        Row: {
          content: string
          generated_at: string
          id: string
          metadata: Json | null
          period_end: string
          period_start: string
          report_type: string
          user_id: string
        }
        Insert: {
          content: string
          generated_at?: string
          id?: string
          metadata?: Json | null
          period_end: string
          period_start: string
          report_type: string
          user_id: string
        }
        Update: {
          content?: string
          generated_at?: string
          id?: string
          metadata?: Json | null
          period_end?: string
          period_start?: string
          report_type?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          advice_count: number
          date: string
          id: string
          message_count: number
          scan_count: number
          user_id: string
        }
        Insert: {
          advice_count?: number
          date?: string
          id?: string
          message_count?: number
          scan_count?: number
          user_id: string
        }
        Update: {
          advice_count?: number
          date?: string
          id?: string
          message_count?: number
          scan_count?: number
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          description: string
          icon_url: string | null
          id: string
          name: string
          rarity: string
        }
        Insert: {
          created_at?: string
          description: string
          icon_url?: string | null
          id: string
          name: string
          rarity?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon_url?: string | null
          id?: string
          name?: string
          rarity?: string
        }
        Relationships: []
      }
      bottles: {
        Row: {
          capacity_ml: number
          created_at: string | null
          description: string | null
          exp_multiplier: number | null
          id: string
          is_premium_only: boolean | null
          name: string
          price_coins: number | null
        }
        Insert: {
          capacity_ml: number
          created_at?: string | null
          description?: string | null
          exp_multiplier?: number | null
          id?: string
          is_premium_only?: boolean | null
          name: string
          price_coins?: number | null
        }
        Update: {
          capacity_ml?: number
          created_at?: string | null
          description?: string | null
          exp_multiplier?: number | null
          id?: string
          is_premium_only?: boolean | null
          name?: string
          price_coins?: number | null
        }
        Relationships: []
      }
      challenges: {
        Row: {
          category: string
          cooldown_hours: number | null
          created_at: string
          description: string
          difficulty: string
          duration_days: number | null
          ends_at: string | null
          exp_multiplier: number | null
          flavor_text: string | null
          grace_days: number | null
          hidden_until_unlocked: boolean | null
          icon: string | null
          id: string
          is_active: boolean
          is_repeatable: boolean | null
          max_rank: number | null
          milestones: Json | null
          min_rank: number
          premium_only: boolean | null
          reward_badge_id: string | null
          reward_coins: number
          reward_exp: number
          reward_title: string | null
          slug: string
          sort_order: number | null
          starts_at: string | null
          target_percent: number | null
          target_value: number | null
          theme_color: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          cooldown_hours?: number | null
          created_at?: string
          description: string
          difficulty?: string
          duration_days?: number | null
          ends_at?: string | null
          exp_multiplier?: number | null
          flavor_text?: string | null
          grace_days?: number | null
          hidden_until_unlocked?: boolean | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_repeatable?: boolean | null
          max_rank?: number | null
          milestones?: Json | null
          min_rank?: number
          premium_only?: boolean | null
          reward_badge_id?: string | null
          reward_coins?: number
          reward_exp?: number
          reward_title?: string | null
          slug: string
          sort_order?: number | null
          starts_at?: string | null
          target_percent?: number | null
          target_value?: number | null
          theme_color?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          cooldown_hours?: number | null
          created_at?: string
          description?: string
          difficulty?: string
          duration_days?: number | null
          ends_at?: string | null
          exp_multiplier?: number | null
          flavor_text?: string | null
          grace_days?: number | null
          hidden_until_unlocked?: boolean | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_repeatable?: boolean | null
          max_rank?: number | null
          milestones?: Json | null
          min_rank?: number
          premium_only?: boolean | null
          reward_badge_id?: string | null
          reward_coins?: number
          reward_exp?: number
          reward_title?: string | null
          slug?: string
          sort_order?: number | null
          starts_at?: string | null
          target_percent?: number | null
          target_value?: number | null
          theme_color?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      club_activity: {
        Row: {
          amount: number | null
          club_id: string | null
          created_at: string | null
          id: string
          message: string
          type: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          club_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          club_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_activity_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_activity_user_public_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_admin_logs: {
        Row: {
          action: string
          club_id: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          action: string
          club_id?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          action?: string
          club_id?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_admin_logs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_challenges: {
        Row: {
          club_id: string | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          start_date: string | null
          target_ml: number
          title: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          target_ml: number
          title: string
        }
        Update: {
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          target_ml?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_daily_stats: {
        Row: {
          club_id: string | null
          id: string
          stat_date: string | null
          total_ml: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          club_id?: string | null
          id?: string
          stat_date?: string | null
          total_ml?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          club_id?: string | null
          id?: string
          stat_date?: string | null
          total_ml?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_daily_stats_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_daily_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          total_ml: number | null
          user_id: string | null
        }
        Insert: {
          club_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          total_ml?: number | null
          user_id?: string | null
        }
        Update: {
          club_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          total_ml?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_members_user_public_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_messages: {
        Row: {
          club_id: string | null
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          user_id: string | null
        }
        Insert: {
          club_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          user_id?: string | null
        }
        Update: {
          club_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_messages_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_messages_user_public_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          description: string | null
          id: string
          member_count: number | null
          min_level_required: number | null
          name: string
          owner_id: string | null
          total_wp: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          member_count?: number | null
          min_level_required?: number | null
          name: string
          owner_id?: string | null
          total_wp?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          member_count?: number | null
          min_level_required?: number | null
          name?: string
          owner_id?: string | null
          total_wp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clubs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_integrations: {
        Row: {
          access_token: string | null
          device_type: string
          id: string
          metadata: Json | null
          refresh_token: string | null
          synced_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          device_type: string
          id?: string
          metadata?: Json | null
          refresh_token?: string | null
          synced_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          device_type?: string
          id?: string
          metadata?: Json | null
          refresh_token?: string | null
          synced_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string | null
          friend_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          user_id?: string
        }
        Relationships: []
      }
      game_balance_config: {
        Row: {
          key: string
          value: Json | null
        }
        Insert: {
          key: string
          value?: Json | null
        }
        Update: {
          key?: string
          value?: Json | null
        }
        Relationships: []
      }
      hydration_battles: {
        Row: {
          challenger_id: string | null
          created_at: string | null
          id: string
          opponent_id: string | null
          stake_coins: number | null
          status: string | null
          winner_id: string | null
        }
        Insert: {
          challenger_id?: string | null
          created_at?: string | null
          id?: string
          opponent_id?: string | null
          stake_coins?: number | null
          status?: string | null
          winner_id?: string | null
        }
        Update: {
          challenger_id?: string | null
          created_at?: string | null
          id?: string
          opponent_id?: string | null
          stake_coins?: number | null
          status?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hydration_battles_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hydration_battles_challenger_public_profile_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hydration_battles_opponent_id_fkey"
            columns: ["opponent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hydration_battles_opponent_public_profile_fkey"
            columns: ["opponent_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hydration_battles_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          content: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          recipient_id: string
          reference_id: string | null
          reference_type: string | null
          type: string
        }
        Insert: {
          actor_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
        }
        Update: {
          actor_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_public_profile_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_cheers: {
        Row: {
          created_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_cheers_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity: string | null
          age: number | null
          avatar_url: string | null
          bed_time: string | null
          cancel_at_period_end: boolean | null
          climate: string | null
          coins: number
          created_at: string | null
          current_streak: number | null
          energy_tracking: boolean | null
          equipped_bottle_id: string | null
          equipped_frame_id: string | null
          equipped_notification_sound: string | null
          equipped_theme_id: string | null
          gender: string | null
          goal: string | null
          google_refresh_token: string | null
          health_goal: string | null
          height: number | null
          id: string
          last_bottle_battery: number | null
          last_bottle_volume: number | null
          last_drink_date: string | null
          last_water_date: string | null
          level: number | null
          longest_streak: number | null
          mood_tracking: boolean | null
          nickname: string
          onboarding_completed: boolean | null
          rank_tier: number
          sleep_hours: number | null
          sleep_quality: number | null
          streak_freezes: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end: string | null
          subscription_start: string | null
          subscription_tier: string
          sync_wellness_data: boolean | null
          total_exp: number
          total_water: number | null
          total_wp: number | null
          updated_at: string | null
          user_title: string | null
          wake_up: string | null
          water_goal: number | null
          water_points: number | null
          water_today: number | null
          weight: number | null
          wp: number | null
        }
        Insert: {
          activity?: string | null
          age?: number | null
          avatar_url?: string | null
          bed_time?: string | null
          cancel_at_period_end?: boolean | null
          climate?: string | null
          coins?: number
          created_at?: string | null
          current_streak?: number | null
          energy_tracking?: boolean | null
          equipped_bottle_id?: string | null
          equipped_frame_id?: string | null
          equipped_notification_sound?: string | null
          equipped_theme_id?: string | null
          gender?: string | null
          goal?: string | null
          google_refresh_token?: string | null
          health_goal?: string | null
          height?: number | null
          id: string
          last_bottle_battery?: number | null
          last_bottle_volume?: number | null
          last_drink_date?: string | null
          last_water_date?: string | null
          level?: number | null
          longest_streak?: number | null
          mood_tracking?: boolean | null
          nickname: string
          onboarding_completed?: boolean | null
          rank_tier?: number
          sleep_hours?: number | null
          sleep_quality?: number | null
          streak_freezes?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_tier?: string
          sync_wellness_data?: boolean | null
          total_exp?: number
          total_water?: number | null
          total_wp?: number | null
          updated_at?: string | null
          user_title?: string | null
          wake_up?: string | null
          water_goal?: number | null
          water_points?: number | null
          water_today?: number | null
          weight?: number | null
          wp?: number | null
        }
        Update: {
          activity?: string | null
          age?: number | null
          avatar_url?: string | null
          bed_time?: string | null
          cancel_at_period_end?: boolean | null
          climate?: string | null
          coins?: number
          created_at?: string | null
          current_streak?: number | null
          energy_tracking?: boolean | null
          equipped_bottle_id?: string | null
          equipped_frame_id?: string | null
          equipped_notification_sound?: string | null
          equipped_theme_id?: string | null
          gender?: string | null
          goal?: string | null
          google_refresh_token?: string | null
          health_goal?: string | null
          height?: number | null
          id?: string
          last_bottle_battery?: number | null
          last_bottle_volume?: number | null
          last_drink_date?: string | null
          last_water_date?: string | null
          level?: number | null
          longest_streak?: number | null
          mood_tracking?: boolean | null
          nickname?: string
          onboarding_completed?: boolean | null
          rank_tier?: number
          sleep_hours?: number | null
          sleep_quality?: number | null
          streak_freezes?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_tier?: string
          sync_wellness_data?: boolean | null
          total_exp?: number
          total_water?: number | null
          total_wp?: number | null
          updated_at?: string | null
          user_title?: string | null
          wake_up?: string | null
          water_goal?: number | null
          water_points?: number | null
          water_today?: number | null
          weight?: number | null
          wp?: number | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          equipped_frame_id: string | null
          id: string
          is_calendar_synced: boolean | null
          level: number | null
          nickname: string
          total_wp: number | null
          updated_at: string | null
          user_title: string | null
          water_goal: number | null
          water_today: number | null
          wp: number | null
        }
        Insert: {
          avatar_url?: string | null
          equipped_frame_id?: string | null
          id: string
          is_calendar_synced?: boolean | null
          level?: number | null
          nickname?: string
          total_wp?: number | null
          updated_at?: string | null
          user_title?: string | null
          water_goal?: number | null
          water_today?: number | null
          wp?: number | null
        }
        Update: {
          avatar_url?: string | null
          equipped_frame_id?: string | null
          id?: string
          is_calendar_synced?: boolean | null
          level?: number | null
          nickname?: string
          total_wp?: number | null
          updated_at?: string | null
          user_title?: string | null
          water_goal?: number | null
          water_today?: number | null
          wp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "public_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_reward_logs: {
        Row: {
          applied_buffs: Json | null
          base_exp: number | null
          base_wp: number | null
          created_at: string | null
          final_exp: number | null
          final_wp: number | null
          id: string
          quest_id: string
          user_id: string
          user_quest_id: string
        }
        Insert: {
          applied_buffs?: Json | null
          base_exp?: number | null
          base_wp?: number | null
          created_at?: string | null
          final_exp?: number | null
          final_wp?: number | null
          id?: string
          quest_id: string
          user_id: string
          user_quest_id: string
        }
        Update: {
          applied_buffs?: Json | null
          base_exp?: number | null
          base_wp?: number | null
          created_at?: string | null
          final_exp?: number | null
          final_wp?: number | null
          id?: string
          quest_id?: string
          user_id?: string
          user_quest_id?: string
        }
        Relationships: []
      }
      quests: {
        Row: {
          action_hint: string | null
          condition_type: string
          condition_value: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          min_level: number
          premium_only: boolean | null
          proof_type: string | null
          rarity: string | null
          reward_badge_id: string | null
          reward_coins: number
          reward_exp: number
          time_end: string | null
          time_start: string | null
          title: string
          type: string
          unit: string | null
        }
        Insert: {
          action_hint?: string | null
          condition_type: string
          condition_value: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          min_level?: number
          premium_only?: boolean | null
          proof_type?: string | null
          rarity?: string | null
          reward_badge_id?: string | null
          reward_coins?: number
          reward_exp?: number
          time_end?: string | null
          time_start?: string | null
          title: string
          type: string
          unit?: string | null
        }
        Update: {
          action_hint?: string | null
          condition_type?: string
          condition_value?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          min_level?: number
          premium_only?: boolean | null
          proof_type?: string | null
          rarity?: string | null
          reward_badge_id?: string | null
          reward_coins?: number
          reward_exp?: number
          time_end?: string | null
          time_start?: string | null
          title?: string
          type?: string
          unit?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          animation_type: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          meta_value: string
          name: string
          preview_color: string | null
          price: number
          rarity: string | null
        }
        Insert: {
          animation_type?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id: string
          image_url?: string | null
          is_active?: boolean | null
          meta_value: string
          name: string
          preview_color?: string | null
          price?: number
          rarity?: string | null
        }
        Update: {
          animation_type?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          meta_value?: string
          name?: string
          preview_color?: string | null
          price?: number
          rarity?: string | null
        }
        Relationships: []
      }
      social_comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "social_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          like_count: number | null
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          like_count?: number | null
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          like_count?: number | null
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          event_type: string | null
          expires_at: string | null
          hydration_ml: number | null
          id: string
          image_url: string | null
          is_squad_highlight: boolean | null
          like_count: number
          post_kind: string
          reference_id: string | null
          streak_snapshot: number | null
          visibility: string
        }
        Insert: {
          author_id: string
          content?: string
          created_at?: string
          event_type?: string | null
          expires_at?: string | null
          hydration_ml?: number | null
          id?: string
          image_url?: string | null
          is_squad_highlight?: boolean | null
          like_count?: number
          post_kind?: string
          reference_id?: string | null
          streak_snapshot?: number | null
          visibility?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          event_type?: string | null
          expires_at?: string | null
          hydration_ml?: number | null
          id?: string
          image_url?: string | null
          is_squad_highlight?: boolean | null
          like_count?: number
          post_kind?: string
          reference_id?: string | null
          streak_snapshot?: number | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_author_public_profile_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          amount_vnd: number | null
          created_at: string
          event_type: string
          id: string
          tier: string
          user_id: string
        }
        Insert: {
          amount_vnd?: number | null
          created_at?: string
          event_type: string
          id?: string
          tier: string
          user_id: string
        }
        Update: {
          amount_vnd?: number | null
          created_at?: string
          event_type?: string
          id?: string
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bottles: {
        Row: {
          acquired_at: string | null
          bottle_id: string | null
          id: string
          is_equipped: boolean | null
          user_id: string | null
        }
        Insert: {
          acquired_at?: string | null
          bottle_id?: string | null
          id?: string
          is_equipped?: boolean | null
          user_id?: string | null
        }
        Update: {
          acquired_at?: string | null
          bottle_id?: string | null
          id?: string
          is_equipped?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_bottles_bottle_id_fkey"
            columns: ["bottle_id"]
            isOneToOne: false
            referencedRelation: "bottles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bottles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          current_value: number
          days_completed: number
          days_failed: number
          id: string
          joined_at: string
          milestones_reached: number[]
          status: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          current_value?: number
          days_completed?: number
          days_failed?: number
          id?: string
          joined_at?: string
          milestones_reached?: number[]
          status?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          current_value?: number
          days_completed?: number
          days_failed?: number
          id?: string
          joined_at?: string
          milestones_reached?: number[]
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_purchases: {
        Row: {
          id: string
          is_equipped: boolean | null
          item_id: string | null
          purchased_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          is_equipped?: boolean | null
          item_id?: string | null
          purchased_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          is_equipped?: boolean | null
          item_id?: string | null
          purchased_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quests: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          id: string
          progress: number
          quest_id: string
          reset_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          id?: string
          progress?: number
          quest_id: string
          reset_date?: string | null
          status?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          id?: string
          progress?: number
          quest_id?: string
          reset_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          water_points: number | null
        }
        Insert: {
          created_at?: string | null
          id: string
          water_points?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          water_points?: number | null
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          amount: number
          created_at: string
          day: string | null
          exp: number | null
          id: number
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          day?: string | null
          exp?: number | null
          id?: number
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          day?: string | null
          exp?: number | null
          id?: number
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      widget_cache: {
        Row: {
          is_partner_goal_completed: boolean | null
          last_updated_at: string | null
          partner_avatar_url: string | null
          partner_id: string | null
          partner_name: string | null
          partner_progress_percent: number | null
          partner_water_goal: number | null
          partner_water_today: number | null
          user_id: string
        }
        Insert: {
          is_partner_goal_completed?: boolean | null
          last_updated_at?: string | null
          partner_avatar_url?: string | null
          partner_id?: string | null
          partner_name?: string | null
          partner_progress_percent?: number | null
          partner_water_goal?: number | null
          partner_water_today?: number | null
          user_id: string
        }
        Update: {
          is_partner_goal_completed?: boolean | null
          last_updated_at?: string | null
          partner_avatar_url?: string | null
          partner_id?: string | null
          partner_name?: string | null
          partner_progress_percent?: number | null
          partner_water_goal?: number | null
          partner_water_today?: number | null
          user_id?: string
        }
        Relationships: []
      }
      world_bosses: {
        Row: {
          current_hp: number | null
          id: string
          max_hp: number | null
          name: string | null
          status: string | null
        }
        Insert: {
          current_hp?: number | null
          id?: string
          max_hp?: number | null
          name?: string | null
          status?: string | null
        }
        Update: {
          current_hp?: number | null
          id?: string
          max_hp?: number | null
          name?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      conversations: {
        Row: {
          last_message_at: string | null
          last_message_preview: string | null
          message_count: number | null
          unread_count: number | null
          user_a: string | null
          user_b: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_battle: {
        Args: { p_battle_id: string; p_user_id: string }
        Returns: undefined
      }
      action_cheers_post: {
        Args: { p_author_id: string; p_local_date: string; p_post_id: string }
        Returns: boolean
      }
      add_water_smart: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      assign_daily_quests: {
        Args: { p_user_id: string }
        Returns: {
          assigned_count: number
          message: string
        }[]
      }
      award_exp_and_rank: {
        Args: { p_coins?: number; p_exp: number; p_user_id: string }
        Returns: Json
      }
      calculate_exp_for_level: { Args: { level_num: number }; Returns: number }
      calculate_level: { Args: { p_exp: number }; Returns: number }
      calculate_level_from_exp: { Args: { total_exp: number }; Returns: number }
      claim_challenge_reward: {
        Args: { p_user_challenge_id: string; p_user_id: string }
        Returns: Json
      }
      claim_quest_reward: {
        Args: { p_user_id: string; p_user_quest_id: string }
        Returns: Json
      }
      consume_ai_usage: { Args: { p_action: string }; Returns: Json }
      create_achievement_post: {
        Args: {
          p_event_type: string
          p_hydration_ml?: number
          p_image_url?: string
          p_streak_days?: number
          p_title: string
          p_user_id: string
          p_visibility?: string
        }
        Returns: string
      }
      deduct_wp_for_club: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      delete_account_and_auth: { Args: never; Returns: undefined }
      delete_all_user_data_secure: { Args: never; Returns: undefined }
      disband_club: { Args: { p_club_id: string }; Returns: undefined }
      get_club_level: { Args: { p_club_id: string }; Returns: number }
      get_exp_required_for_level: { Args: { p_level: number }; Returns: number }
      get_profile_stats: { Args: { p_user_id: string }; Returns: Json }
      get_squad_feed: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          author_avatar: string
          author_id: string
          author_name: string
          content: string
          created_at: string
          event_type: string
          hydration_ml: number
          id: string
          image_url: string
          is_mine: boolean
          streak_snapshot: number
        }[]
      }
      get_user_quests_with_details: {
        Args: { p_user_id: string }
        Returns: {
          claimed_at: string
          current_value: number
          description: string
          exp_reward: number
          expires_at: string
          goal_value: number
          is_completed: boolean
          quest_id: string
          quest_type: string
          title: string
          user_quest_id: string
          wp_reward: number
        }[]
      }
      increment_ai_usage: {
        Args: { col_name: string; uid: string }
        Returns: number
      }
      increment_club_water: {
        Args: { p_amount: number; p_club_id: string; p_user_id: string }
        Returns: undefined
      }
      increment_water_log: {
        Args: { amount_param: number; day_param: string; user_id_param: string }
        Returns: undefined
      }
      is_premium: { Args: { uid: string }; Returns: boolean }
      join_challenge: {
        Args: { p_challenge_id: string; p_stake_wp: number; p_user_id: string }
        Returns: boolean
      }
      join_club: {
        Args: { p_club_id: string; p_user_id: string }
        Returns: undefined
      }
      log_water_and_update_streak:
        | {
            Args: { p_amount: number; p_exp?: number; p_user_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_exp?: number
              p_ml_added: number
              p_name?: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_day: string
              p_exp: number
              p_ml_added: number
              p_name: string
              p_user_id: string
            }
            Returns: Json
          }
      manual_sync_water_data: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      process_hydration_event: {
        Args: {
          p_amount_ml: number
          p_exercise_mins?: number
          p_is_fasting?: boolean
          p_temp_c?: number
          p_user_id: string
        }
        Returns: Json
      }
      pulse_post: { Args: { p_post_id: string }; Returns: undefined }
      purchase_item: {
        Args: { p_item_id: string; p_user_id: string }
        Returns: boolean
      }
      recalculate_user_level: {
        Args: { user_id?: string }
        Returns: {
          updated_count: number
        }[]
      }
      recalculate_user_total_exp: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      resolve_stale_battle: { Args: { battle_id: string }; Returns: Json }
      use_streak_freeze: { Args: { p_user_id: string }; Returns: Json }
    }
    Enums: {
      notification_type:
        | "like_post"
        | "like_comment"
        | "comment"
        | "follow"
        | "mention"
        | "dm"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      notification_type: [
        "like_post",
        "like_comment",
        "comment",
        "follow",
        "mention",
        "dm",
      ],
    },
  },
} as const
