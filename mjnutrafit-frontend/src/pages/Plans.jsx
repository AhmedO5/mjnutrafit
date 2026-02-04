import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Plans = () => {
  const { userRole, logout } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    dietText: "",
    workoutText: "",
  });
  const [clients, setClients] = useState([]);

  useEffect(() => {
    loadPlans();
    if (userRole === "coach") {
      loadClients();
    }
  }, [userRole]);

  const loadPlans = async () => {
    try {
      const data = await apiService.getPlans();
      setPlans(data);
    } catch (error) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const data = await apiService.getMyClients();
      setClients(data);
    } catch (error) {
      toast.error("Failed to load clients");
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      await apiService.createPlan(formData);
      toast.success("Plan created successfully");
      setShowCreateForm(false);
      setFormData({ clientId: "", dietText: "", workoutText: "" });
      loadPlans();
    } catch (error) {
      toast.error("Failed to create plan");
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
          <h1 className="text-3xl font-bold mb-2">Plans</h1>
          <p className="text-muted-foreground">
            {userRole === "coach" ? "Create and manage plans for your clients" : "View your assigned diet and workout plans"}
          </p>
        </div>

        {userRole === "coach" && (
          <div className="mb-8">
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? "Cancel" : "Create Plan"}
            </Button>
          </div>
        )}

        {userRole === "coach" && showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Plan</CardTitle>
              <CardDescription>Assign a diet and workout plan to a client</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div>
                  <label htmlFor="clientId" className="text-sm font-medium">
                    Client
                  </label>
                  <select
                    id="clientId"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.first_name} {client.last_name} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="dietText" className="text-sm font-medium">
                    Diet Plan
                  </label>
                  <textarea
                    id="dietText"
                    value={formData.dietText}
                    onChange={(e) => setFormData({ ...formData, dietText: e.target.value })}
                    className="mt-1 flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="workoutText" className="text-sm font-medium">
                    Workout Plan
                  </label>
                  <textarea
                    id="workoutText"
                    value={formData.workoutText}
                    onChange={(e) => setFormData({ ...formData, workoutText: e.target.value })}
                    className="mt-1 flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <Button type="submit">Create Plan</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {plans.length > 0 ? (
            plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        {userRole === "coach"
                          ? `Plan for ${plan.client?.firstName} ${plan.client?.lastName}`
                          : `Plan from ${plan.coach?.firstName} ${plan.coach?.lastName}`}
                      </CardTitle>
                      <CardDescription>
                        Created: {new Date(plan.createdAt).toLocaleDateString()}
                        {plan.isActive && <span className="ml-2 text-primary">Active</span>}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Diet Plan</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {plan.dietText}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Workout Plan</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {plan.workoutText}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  {userRole === "coach" ? "No plans created yet" : "No plans assigned yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Plans;
