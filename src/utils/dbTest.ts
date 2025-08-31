import { supabase } from '@/integrations/supabase/client';

export interface DBTestResult {
  test: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

export class DatabaseTester {
  static async testConnection(): Promise<DBTestResult> {
    const start = Date.now();
    try {
      // Simple ping test
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      const duration = Date.now() - start;
      
      if (error) {
        return {
          test: 'Connection Test',
          success: false,
          duration,
          error: error.message
        };
      }
      
      return {
        test: 'Connection Test',
        success: true,
        duration,
        data: `Found ${data?.length || 0} profiles`
      };
    } catch (err: any) {
      return {
        test: 'Connection Test',
        success: false,
        duration: Date.now() - start,
        error: err.message
      };
    }
  }

  static async testProfilesTable(): Promise<DBTestResult> {
    const start = Date.now();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, created_at')
        .limit(5);
      
      const duration = Date.now() - start;
      
      if (error) {
        return {
          test: 'Profiles Table Test',
          success: false,
          duration,
          error: error.message
        };
      }
      
      return {
        test: 'Profiles Table Test',
        success: true,
        duration,
        data: `Found ${data?.length || 0} profiles`
      };
    } catch (err: any) {
      return {
        test: 'Profiles Table Test',
        success: false,
        duration: Date.now() - start,
        error: err.message
      };
    }
  }

  static async testSpecificUser(userId: string): Promise<DBTestResult> {
    const start = Date.now();
    try {
      console.log('🧪 Testing specific user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, first_name, last_name, created_at')
        .eq('id', userId)
        .single();
      
      const duration = Date.now() - start;
      
      if (error) {
        return {
          test: 'Specific User Test',
          success: false,
          duration,
          error: error.message
        };
      }
      
      return {
        test: 'Specific User Test',
        success: true,
        duration,
        data: {
          id: data?.id,
          role: data?.role,
          name: `${data?.first_name} ${data?.last_name}`,
          created: data?.created_at
        }
      };
    } catch (err: any) {
      return {
        test: 'Specific User Test',
        success: false,
        duration: Date.now() - start,
        error: err.message
      };
    }
  }

  static async runAllTests(userId?: string): Promise<DBTestResult[]> {
    console.log('🔍 Running database tests...');
    
    const results: DBTestResult[] = [];
    
    // Test 1: Basic connection
    results.push(await this.testConnection());
    
    // Test 2: Profiles table
    results.push(await this.testProfilesTable());
    
    // Test 3: Specific user (if provided)
    if (userId) {
      results.push(await this.testSpecificUser(userId));
    }
    
    return results;
  }
}
