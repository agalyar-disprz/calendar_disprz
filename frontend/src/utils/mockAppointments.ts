import { Appointment } from "../types/appointment";

export const getMockAppointments = (date: Date): Appointment[] => {
  const dateStr = date.toISOString().split("T")[0];

  return [
    {
      id: 1,
      title: "Strategic Planning",
      startTime: `${dateStr}T09:00:00`,
      endTime: `${dateStr}T10:30:00`,
      description: "Quarterly planning session with the team",
    },
    {
      id: 2,
      title: "Client Presentation",
      startTime: `${dateStr}T11:00:00`,
      endTime: `${dateStr}T12:00:00`,
      description: "Present new product features to client",
    },
    {
      id: 3,
      title: "Feature Review",
      startTime: `${dateStr}T14:00:00`,
      endTime: `${dateStr}T15:30:00`,
      description: "Review new features with development team",
    },
    {
      id: 4,
      title: "Team Sync",
      startTime: `${dateStr}T16:00:00`,
      endTime: `${dateStr}T16:30:00`,
      description: "Quick team sync-up",
    },
    {
      id: 5,
      title: "Project Planning",
      startTime: `${dateStr}T17:00:00`,
      endTime: `${dateStr}T18:00:00`,
      description: "Plan upcoming project milestones",
    },
    {
      id: 6,
      title: "Late Interview",
      startTime: `${dateStr}T22:19:00`,
      endTime: `${dateStr}T22:23:00`,
      description: "Late evening interview slot",
    },
  ];
};
