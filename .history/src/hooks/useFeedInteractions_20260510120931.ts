import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

interface UseFeedInteractionsProps {
  currentUserId: string | undefined;
  postId: string;
