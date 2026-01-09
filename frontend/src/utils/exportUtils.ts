import { Schedule, ScheduleSlot, DAYS_OF_WEEK, TIME_SLOTS } from '@/types';

/**
 * Export schedule to CSV format
 */
export const exportToCSV = (schedule: Schedule): void => {
  if (!schedule.slots || schedule.slots.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  // Create CSV header
  const headers = ['Dia', 'Hora Inicio', 'Hora Fin', 'Curso', 'Docente', 'Aula', 'Tipo'];

  // Create CSV rows
  const rows = schedule.slots.map((slot) => [
    DAYS_OF_WEEK[slot.day_of_week],
    slot.start_time,
    slot.end_time,
    slot.course?.code || `Curso ${slot.course_id}`,
    `Docente ${slot.teacher_id}`,
    slot.classroom?.code || `Aula ${slot.classroom_id}`,
    slot.session_type || 'N/A',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `horario_${schedule.name}_${Date.now()}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export schedule to JSON format
 */
export const exportToJSON = (schedule: Schedule): void => {
  const jsonContent = JSON.stringify(schedule, null, 2);

  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `horario_${schedule.name}_${Date.now()}.json`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Print schedule
 */
export const printSchedule = (): void => {
  window.print();
};

/**
 * Export schedule data for PDF generation (future implementation)
 * This prepares data that can be sent to a backend PDF generator
 */
export const prepareForPDF = (schedule: Schedule): any => {
  // Create a grid structure for PDF
  const grid: any[][] = Array(7)
    .fill(null)
    .map(() => Array(TIME_SLOTS.length).fill(null));

  schedule.slots?.forEach((slot) => {
    const timeSlotIndex = TIME_SLOTS.findIndex(
      (ts) => ts.start === slot.start_time
    );
    if (timeSlotIndex !== -1 && slot.day_of_week < 7) {
      grid[slot.day_of_week][timeSlotIndex] = {
        course: slot.course?.code || `Curso ${slot.course_id}`,
        courseName: slot.course?.name || '',
        classroom: slot.classroom?.code || `Aula ${slot.classroom_id}`,
        teacher: `Docente ${slot.teacher_id}`,
        type: slot.session_type || 'N/A',
      };
    }
  });

  return {
    title: schedule.name,
    semester: schedule.semester,
    year: schedule.year,
    grid,
    days: DAYS_OF_WEEK,
    timeSlots: TIME_SLOTS,
  };
};

/**
 * Generate Excel-compatible HTML table (can be opened in Excel)
 */
export const exportToExcel = (schedule: Schedule): void => {
  if (!schedule.slots || schedule.slots.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  // Create a grid structure
  const grid: (ScheduleSlot | null)[][] = Array(7)
    .fill(null)
    .map(() => Array(TIME_SLOTS.length).fill(null));

  schedule.slots.forEach((slot) => {
    const timeSlotIndex = TIME_SLOTS.findIndex(
      (ts) => ts.start === slot.start_time
    );
    if (timeSlotIndex !== -1 && slot.day_of_week < 7) {
      grid[slot.day_of_week][timeSlotIndex] = slot;
    }
  });

  // Generate HTML table
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head>
      <meta charset="UTF-8">
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid black; padding: 8px; text-align: center; }
        th { background-color: #1976d2; color: white; font-weight: bold; }
        .time-cell { background-color: #f5f5f5; font-weight: bold; }
      </style>
    </head>
    <body>
      <h2>${schedule.name} - ${schedule.semester}/${schedule.year}</h2>
      <table>
        <tr>
          <th>Horario</th>
  `;

  // Add day headers
  DAYS_OF_WEEK.slice(0, 6).forEach((day) => {
    html += `<th>${day}</th>`;
  });
  html += '</tr>';

  // Add time slots
  TIME_SLOTS.forEach((timeSlot, timeIndex) => {
    html += `<tr>`;
    html += `<td class="time-cell">${timeSlot.start} - ${timeSlot.end}</td>`;

    for (let dayIndex = 0; dayIndex < 6; dayIndex++) {
      const slot = grid[dayIndex][timeIndex];
      if (slot) {
        html += `<td>${slot.course?.code || `Curso ${slot.course_id}`}<br/>${
          slot.classroom?.code || `Aula ${slot.classroom_id}`
        }</td>`;
      } else {
        html += '<td></td>';
      }
    }

    html += '</tr>';
  });

  html += `
      </table>
    </body>
    </html>
  `;

  // Create and download file
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `horario_${schedule.name}_${Date.now()}.xls`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
