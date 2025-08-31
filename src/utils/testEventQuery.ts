import { supabase } from '@/integrations/supabase/client';

/**
 * Test utility to verify the EventList query works correctly
 * This function tests the exact query used in EventList component
 */
export const testEventQuery = async () => {
  console.log('🧪 Testing EventList query...');
  
  try {
    // Test the exact query used in EventList
    const query = supabase
      .from('events')
      .select(`
        *,
        event_registrations!left(
          id
        )
      `)
      .order('event_date', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('❌ Query failed:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }

    console.log('✅ Query successful! Found', data?.length || 0, 'events');
    
    // Log some sample data (without sensitive info)
    if (data && data.length > 0) {
      console.log('📋 Sample event data structure:', {
        id: data[0].id,
        name: data[0].name,
        event_date: data[0].event_date,
        location: data[0].location,
        max_participants: data[0].max_participants,
        created_at: data[0].created_at,
        hasRegistrations: !!data[0].event_registrations,
        registrationCount: data[0].event_registrations?.length || 0
      });
    }

    return {
      success: true,
      eventCount: data?.length || 0,
      sampleEvent: data?.[0] || null
    };

  } catch (error: any) {
    console.error('❌ Test failed with exception:', error);
    return {
      success: false,
      error: error.message,
      exception: error
    };
  }
};

/**
 * Test creating a sample event (for development/testing only)
 */
export const testCreateEvent = async (testData?: any) => {
  console.log('🧪 Testing event creation...');
  
  try {
    const eventData = testData || {
      name: 'Test Event - ' + new Date().toISOString(),
      description: 'This is a test event created by the test utility',
      event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      location: 'Test Location',
      max_participants: 50,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (error) {
      console.error('❌ Event creation failed:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }

    console.log('✅ Test event created successfully:', data?.name);
    
    return {
      success: true,
      event: data
    };

  } catch (error: any) {
    console.error('❌ Event creation test failed:', error);
    return {
      success: false,
      error: error.message,
      exception: error
    };
  }
};

/**
 * Clean up test events (removes events with "Test Event" in the name)
 */
export const cleanupTestEvents = async () => {
  console.log('🧹 Cleaning up test events...');
  
  try {
    const { data, error } = await supabase
      .from('events')
      .delete()
      .like('name', '%Test Event%')
      .select();

    if (error) {
      console.error('❌ Cleanup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Cleaned up', data?.length || 0, 'test events');
    
    return {
      success: true,
      deletedCount: data?.length || 0
    };

  } catch (error: any) {
    console.error('❌ Cleanup failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export a combined test function
export const runEventTests = async () => {
  console.log('🚀 Running EventList database tests...');
  
  const results = {
    queryTest: await testEventQuery(),
    // Uncomment the lines below if you want to test creation/cleanup
    // createTest: await testCreateEvent(),
    // cleanupTest: await cleanupTestEvents()
  };

  console.log('📊 Test Results Summary:');
  console.log('- Query Test:', results.queryTest.success ? '✅ PASSED' : '❌ FAILED');
  // console.log('- Create Test:', results.createTest.success ? '✅ PASSED' : '❌ FAILED');
  // console.log('- Cleanup Test:', results.cleanupTest.success ? '✅ PASSED' : '❌ FAILED');

  return results;
};

// Make the test available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testEventQuery = testEventQuery;
  (window as any).runEventTests = runEventTests;
  console.log('🔧 Test utilities available: testEventQuery(), runEventTests()');
}
