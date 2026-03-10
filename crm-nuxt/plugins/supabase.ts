
import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const supabaseUrl = 'https://ebfxdhwagcboyuscgigh.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZnhkaHdhZ2Nib3l1c2NnaWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDIwMjIsImV4cCI6MjA4ODQ3ODAyMn0.8HXM0aAC27zZa9ghMDfvfzrxi0cyZnKkMGy9IWEXNzc'
  const supabase = createClient(supabaseUrl, supabaseKey)

  return {
    provide: {
      supabase
    }
  }
})
