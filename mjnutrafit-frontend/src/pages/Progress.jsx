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
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

const Progress = () => {
  const { userRole, logout } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [formData, setFormData] = useState({
    weekStartDate: "",
    weight: "",
    mealAdherence: "",
    workoutCompletion: "",
    notes: "",
  });
  const [reviewingLog, setReviewingLog] = useState(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await apiService.getProgressLogs();
      setLogs(data);
    } catch (error) {
      toast.error("Failed to load progress logs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    try {
      await apiService.submitProgressLog({
        ...formData,
        weight: parseFloat(formData.weight),
        mealAdherence: parseInt(formData.mealAdherence),
        workoutCompletion: parseInt(formData.workoutCompletion),
      });
      toast.success("Progress log submitted successfully");
      setShowSubmitForm(false);
      setFormData({
        weekStartDate: "",
        weight: "",
        mealAdherence: "",
        workoutCompletion: "",
        notes: "",
      });
      loadLogs();
    } catch (error) {
      toast.error("Failed to submit progress log");
    }
  };

  const handleReviewLog = async (action) => {
    if (action === "reject" && !feedback.trim()) {
      toast.error("Feedback is required when rejecting");
      return;
    }
    try {
      await apiService.reviewProgressLog(reviewingLog.id, action, feedback);
      toast.success(`Progress log ${action}d successfully`);
      setReviewingLog(null);
      setFeedback("");
      loadLogs();
    } catch (error) {
      toast.error(`Failed to ${action} progress log`);
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
        {userRole === "client" && (
          <div className="mb-8">
            <Button onClick={() => setShowSubmitForm(!showSubmitForm)}>
              {showSubmitForm ? "Cancel" : "Submit Progress"}
            </Button>
          </div>
        )}

        {userRole === "client" && showSubmitForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Submit Weekly Progress</CardTitle>
              <CardDescription>Log your progress for the week</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitLog} className="space-y-4">
                <div>
                  <label htmlFor="weekStartDate" className="text-sm font-medium">
                    Week Start Date
                  </label>
                  <Input
                    id="weekStartDate"
                    type="date"
                    value={formData.weekStartDate}
                    onChange={(e) => setFormData({ ...formData, weekStartDate: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="weight" className="text-sm font-medium">
                    Weight (kg)
                  </label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="mealAdherence" className="text-sm font-medium">
                    Meal Adherence (%)
                  </label>
                  <Input
                    id="mealAdherence"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.mealAdherence}
                    onChange={(e) => setFormData({ ...formData, mealAdherence: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="workoutCompletion" className="text-sm font-medium">
                    Workout Completion (%)
                  </label>
                  <Input
                    id="workoutCompletion"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.workoutCompletion}
                    onChange={(e) => setFormData({ ...formData, workoutCompletion: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="notes" className="text-sm font-medium">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="mt-1 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <Button type="submit">Submit Progress</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {userRole === "coach" && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Progress Logs Awaiting Review</h2>
              <p className="text-muted-foreground">
                Review and approve or reject client progress submissions
              </p>
            </div>
          )}
          
          {logs.length > 0 ? (
            logs.map((log) => {
              const statusConfig = {
                submitted: { label: "Pending Review", icon: Clock, variant: "secondary", color: "text-yellow-600" },
                approved: { label: "Approved", icon: CheckCircle2, variant: "default", color: "text-green-600" },
                rejected: { label: "Rejected", icon: XCircle, variant: "destructive", color: "text-red-600" },
              };
              
              const statusInfo = statusConfig[log.status] || statusConfig.submitted;
              const StatusIcon = statusInfo.icon;
              const mealAdherence = log.mealAdherence || log.meal_adherence || 0;
              const workoutCompletion = log.workoutCompletion || log.workout_completion || 0;
              
              return (
                <Card key={log.id} className={log.status === "submitted" ? "border-2 border-primary" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle>
                            {userRole === "coach"
                              ? `${log.clientFirstName || ""} ${log.clientLastName || ""}`.trim() || log.clientEmail
                              : `Week of ${new Date(log.weekStartDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
                          </CardTitle>
                          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        {userRole === "coach" && (
                          <CardDescription>
                            Week of {new Date(log.weekStartDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                            {log.clientEmail && ` • ${log.clientEmail}`}
                          </CardDescription>
                        )}
                      </div>
                      {userRole === "coach" && log.status === "submitted" && (
                        <Button
                          onClick={() => setReviewingLog(log)}
                          variant="default"
                          size="sm"
                          className="ml-4"
                        >
                          Review Now
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6 mb-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Current Weight</p>
                        <p className="text-2xl font-bold">{log.weight} kg</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Meal Adherence</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold">{mealAdherence}%</p>
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                mealAdherence >= 80 ? "bg-green-500" : 
                                mealAdherence >= 60 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${mealAdherence}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Workout Completion</p>
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold">{workoutCompletion}%</p>
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                workoutCompletion >= 80 ? "bg-green-500" : 
                                workoutCompletion >= 60 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${workoutCompletion}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {log.notes && (
                      <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Client Notes
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{log.notes}</p>
                      </div>
                    )}
                    
                    {log.feedback && (
                      <div className="border-t pt-4 mt-4">
                        <p className="text-sm font-medium mb-2">Coach Feedback</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{log.feedback.feedback}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  {userRole === "coach" 
                    ? "No progress logs to review" 
                    : "No progress logs yet. Submit your first progress log to get started!"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {reviewingLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-xl">Review Progress Submission</CardTitle>
                <CardDescription>
                  Review the details below before approving or rejecting this progress log
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Client Info */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Client</p>
                  <p className="text-lg font-semibold">
                    {reviewingLog.clientFirstName || ""} {reviewingLog.clientLastName || ""}
                  </p>
                  {reviewingLog.clientEmail && (
                    <p className="text-sm text-muted-foreground">{reviewingLog.clientEmail}</p>
                  )}
                </div>

                {/* Week Info */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Week</p>
                  <p className="text-lg font-semibold">
                    {new Date(reviewingLog.weekStartDate).toLocaleDateString("en-US", { 
                      month: "long", 
                      day: "numeric", 
                      year: "numeric" 
                    })}
                  </p>
                </div>

                {/* Progress Metrics */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Current Weight</p>
                    <p className="text-3xl font-bold">{reviewingLog.weight} kg</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Meal Adherence</p>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold">
                        {reviewingLog.mealAdherence || reviewingLog.meal_adherence || 0}%
                      </p>
                      <div className="bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (reviewingLog.mealAdherence || reviewingLog.meal_adherence || 0) >= 80 ? "bg-green-500" : 
                            (reviewingLog.mealAdherence || reviewingLog.meal_adherence || 0) >= 60 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${reviewingLog.mealAdherence || reviewingLog.meal_adherence || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Workout Completion</p>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold">
                        {reviewingLog.workoutCompletion || reviewingLog.workout_completion || 0}%
                      </p>
                      <div className="bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (reviewingLog.workoutCompletion || reviewingLog.workout_completion || 0) >= 80 ? "bg-green-500" : 
                            (reviewingLog.workoutCompletion || reviewingLog.workout_completion || 0) >= 60 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${reviewingLog.workoutCompletion || reviewingLog.workout_completion || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Notes */}
                {reviewingLog.notes && (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Client Notes
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{reviewingLog.notes}</p>
                  </div>
                )}

                {/* Feedback Input */}
                <div>
                  <label htmlFor="feedback" className="text-sm font-medium mb-2 block">
                    Your Feedback {reviewingLog.status === "submitted" && <span className="text-muted-foreground">(Required if rejecting)</span>}
                  </label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Provide feedback to help the client improve. This is required when rejecting a submission..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleReviewLog("approve")}
                    className="flex-1"
                    size="lg"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReviewLog("reject")}
                    variant="destructive"
                    className="flex-1"
                    size="lg"
                    disabled={!feedback.trim()}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setReviewingLog(null);
                      setFeedback("");
                    }}
                    variant="outline"
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Progress;
