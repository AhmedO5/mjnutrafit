import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ClientDashboard = () => {
  const { userRole, userStatus, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole === "coach") {
      navigate("/coach-dashboard");
      return;
    }
    if (userStatus === "pending") {
      // Show waiting for approval screen
      return;
    }
    loadDashboard();
  }, [userRole, userStatus, navigate]);

  const loadDashboard = async () => {
    try {
      const data = await apiService.getClientDashboard();
      setDashboardData(data);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (userStatus === "pending") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Waiting for Approval</CardTitle>
              <CardDescription className="text-center">
                Your account is pending approval from a coach
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground mb-4">
                Please wait while a coach reviews your registration. You'll be notified once your account is approved.
              </p>
              <Button onClick={logout} variant="outline" className="w-full">
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your fitness overview.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Latest Weight</CardTitle>
              <CardDescription>Your most recent weight measurement</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {dashboardData?.latestWeight ? `${dashboardData.latestWeight} kg` : "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Last Submission</CardTitle>
              <CardDescription>Status of your last progress log</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.lastSubmission ? (
                <div>
                  <p className="text-lg font-semibold capitalize mb-2">
                    {dashboardData.lastSubmission.status}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Week of {new Date(dashboardData.lastSubmission.weekStartDate).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No submissions yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {dashboardData?.currentPlan && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active diet and workout plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Diet Plan</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {dashboardData.currentPlan.dietText}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Workout Plan</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {dashboardData.currentPlan.workoutText}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {dashboardData?.weightTrend && dashboardData.weightTrend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Weight Trend</CardTitle>
              <CardDescription>Your progress over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.weightTrend.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center p-2 border-b">
                    <span className="text-sm">
                      {new Date(entry.weekStartDate).toLocaleDateString()}
                    </span>
                    <span className="font-semibold">{entry.weight} kg</span>
                    <span className="text-sm text-muted-foreground">
                      Meals: {entry.mealAdherence}% | Workouts: {entry.workoutCompletion}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ClientDashboard;
