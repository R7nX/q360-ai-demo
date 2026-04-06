import { EmployeeHeader } from "@/components/ai/employee/EmployeeHeader";
import { ScheduleView } from "@/components/ai/employee/ScheduleView";
import {
  CURRENT_EMPLOYEE,
  getEmployeeSchedulePageData,
} from "@/lib/employeeHome";

export default async function SchedulePage() {
  const data = await getEmployeeSchedulePageData(CURRENT_EMPLOYEE);

  return (
    <>
      <EmployeeHeader
        title="Schedule"
        description="See upcoming work windows, planned assignments, and schedule context in a readable week-style employee view."
      />
      <section className="flex-1 px-4 py-6 md:px-8">
        <ScheduleView
          weekRange={data.weekRange}
          focusLabel={data.focusLabel}
          entries={data.entries}
          confirmedStops={data.summary.confirmedStops}
          travelBlocks={data.summary.travelBlocks}
          holds={data.summary.holds}
        />
      </section>
    </>
  );
}
