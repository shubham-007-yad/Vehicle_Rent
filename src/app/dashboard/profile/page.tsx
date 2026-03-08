import { auth } from "@/auth";
import { EditProfileForm } from "@/components/settings/edit-profile-form";
import connectDB from "@/lib/db";
import User from "@/models/User";

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    return (
      <div className="p-8 text-center border rounded-xl bg-destructive/5">
        <p className="text-destructive font-bold">Session expired. Please login again.</p>
      </div>
    );
  }

  try {
    await connectDB();
    
    // Attempt to find by ID, with a fallback to Email
    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    
    let dbUser = null;
    if (userId) {
      dbUser = await User.findById(userId);
    }
    
    if (!dbUser && userEmail) {
      dbUser = await User.findOne({ email: userEmail });
    }
    
    if (!dbUser) {
      console.error("Profile not found for:", { userId, userEmail });
      return (
        <div className="p-8 text-center border rounded-xl bg-destructive/5">
          <p className="text-destructive font-bold">User profile not found in database.</p>
          <p className="text-xs text-muted-foreground mt-2">Debug: {userId || 'No ID'} | {userEmail || 'No Email'}</p>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 pb-10 md:pb-0">
        <div className="px-1 md:px-0">
          <h1 className="text-2xl md:text-3xl font-bold italic tracking-tight">Your Profile</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Manage your personal information, profile picture, and bio.
          </p>
        </div>

        <EditProfileForm user={JSON.parse(JSON.stringify(dbUser))} />
      </div>
    );
  } catch (error) {
    console.error("Profile page DB error:", error);
    return (
      <div className="p-8 text-center border rounded-xl bg-destructive/5">
        <p className="text-destructive font-bold">Failed to connect to database. Please try again.</p>
      </div>
    );
  }
}
