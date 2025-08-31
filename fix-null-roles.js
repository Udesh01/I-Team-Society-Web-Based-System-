import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xywggqgljyoicqqhrlst.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5d2dncWdsanlvaWNxcWhybHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MjY5MDksImV4cCI6MjA3MjAwMjkwOX0.O0qAADbVIphRKkXH0cUP6Gpj4aDEXtg_RIDUJxL7JLk";

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixNullRoles() {
  console.log("🔍 Checking for users with NULL roles...");

  try {
    // 1. First, check how many users have NULL roles
    const { data: usersWithoutRoles, error: checkError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, role, created_at")
      .is("role", null);

    if (checkError) {
      console.error("❌ Error checking for NULL roles:", checkError);
      return;
    }

    console.log(`📊 Found ${usersWithoutRoles.length} users with NULL roles`);

    if (usersWithoutRoles.length === 0) {
      console.log("✅ All users have roles assigned!");
      return;
    }

    // 2. Show details of users without roles
    console.log("\n👥 Users without roles:");
    usersWithoutRoles.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.first_name} ${user.last_name} (${
          user.id
        }) - Created: ${new Date(user.created_at).toLocaleDateString()}`
      );
    });

    // 3. Update all NULL roles to 'student'
    console.log('\n🔧 Fixing NULL roles by setting them to "student"...');
    const { data: updatedUsers, error: updateError } = await supabase
      .from("profiles")
      .update({ role: "student" })
      .is("role", null)
      .select("id, first_name, last_name, role");

    if (updateError) {
      console.error("❌ Error updating NULL roles:", updateError);
      return;
    }

    console.log(
      `✅ Successfully updated ${updatedUsers.length} users with default "student" role`
    );

    // 4. Verify the fix
    console.log("\n🔍 Verifying the fix...");
    const { data: remainingNullUsers, error: verifyError } = await supabase
      .from("profiles")
      .select("id")
      .is("role", null);

    if (verifyError) {
      console.error("❌ Error verifying fix:", verifyError);
      return;
    }

    if (remainingNullUsers.length === 0) {
      console.log("🎉 SUCCESS: All users now have roles assigned!");
    } else {
      console.log(
        `⚠️ Warning: ${remainingNullUsers.length} users still have NULL roles`
      );
    }

    // 5. Show final role distribution
    const { data: roleDistribution, error: distError } = await supabase
      .from("profiles")
      .select("role")
      .not("role", "is", null);

    if (!distError && roleDistribution) {
      const roleCounts = roleDistribution.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});

      console.log("\n📈 Current role distribution:");
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`  ${role}: ${count} users`);
      });
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Execute the fix
console.log("🚀 Starting NULL role fix script...\n");
fixNullRoles()
  .then(() => {
    console.log("\n✨ Fix script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
