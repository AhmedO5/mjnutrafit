import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CoachDashboard = () => {
  const { userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingClients, setPendingClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole !== "coach") {
      navigate("/dashboard");
      return;
    }
    loadDashboard();
    loadPendingClients();
  }, [userRole, navigate]);

  const loadDashboard = async () => {
    try {
      const data = await apiService.getCoachDashboard();
      setDashboardData(data);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingClients = async () => {
    try {
      const data = await apiService.getPendingClients();
      setPendingClients(data);
    } catch (error) {
      toast.error("Failed to load pending clients");
    }
  };

  const handleApproveClient = async (clientId) => {
    try {
      await apiService.approveClient(clientId);
      toast.success("Client approved successfully");
      loadDashboard();
      loadPendingClients();
    } catch (error) {
      toast.error("Failed to approve client");
    }
  };

  const handleRejectClient = async (clientId) => {
    try {
      await apiService.rejectClient(clientId);
      toast.success("Client rejected");
      loadDashboard();
      loadPendingClients();
    } catch (error) {
      toast.error("Failed to reject client");
    }
  };

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
          <h1 className="text-3xl font-bold mb-2">Coach Dashboard</h1>
          <p className="text-muted-foreground">Manage your clients and review their progress.</p>
        </div>

        {dashboardData?.pendingLogsCount > 0 && (
          <Card className="mb-8 border-primary">
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>
                You have {dashboardData.pendingLogsCount} progress logs waiting for review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/progress">
                <Button>Review Now</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {pendingClients.length > 0 && (
          <Card className="mb-8 border-primary">
            <CardHeader>
              <CardTitle>Pending Client Approvals</CardTitle>
              <CardDescription>
                {pendingClients.length} client(s) waiting for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingClients.map((client) => (
                  <div key={client.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">
                        {client.first_name} {client.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Registered: {new Date(client.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveClient(client.id)}
                        size="sm"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRejectClient(client.id)}
                        variant="destructive"
                        size="sm"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>My Clients</CardTitle>
            <CardDescription>Clients assigned to you</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.clients && dashboardData.clients.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.clients.map((client) => (
                  <div key={client.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">
                          {client.first_name} {client.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                        <p className="text-sm mt-2">
                          Status: <span className="capitalize">{client.status}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Plans: {client.planCount} | Logs: {client.logCount}
                        </p>
                        {client.avgMealAdherence && (
                          <p className="text-sm text-muted-foreground">
                            Avg Meal Adherence: {parseFloat(client.avgMealAdherence).toFixed(1)}% | 
                            Avg Workout Completion: {parseFloat(client.avgWorkoutCompletion).toFixed(1)}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No clients assigned yet</p>
            )}
          </CardContent>
        </Card>

        {dashboardData?.weightTrends && Object.keys(dashboardData.weightTrends).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Weight Trends</CardTitle>
              <CardDescription>Client progress over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(dashboardData.weightTrends).map(([clientId, trends]) => {
                  const client = dashboardData.clients.find((c) => c.id === parseInt(clientId));
                  return (
                    <div key={clientId} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4">
                        {client?.first_name} {client?.last_name}
                      </h3>
                      <div className="space-y-2">
                        {trends.map((entry, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span>{new Date(entry.week_start_date).toLocaleDateString()}</span>
                            <span className="font-semibold">{entry.weight} kg</span>
                            <span className="text-muted-foreground">
                              Meals: {entry.meal_adherence}% | Workouts: {entry.workout_completion}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CoachDashboard;
