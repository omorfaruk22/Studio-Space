type InvoiceBooking = {
  id: string;
  studioTitle: string;
  studioLocation: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  numberOfPeople: number;
  durationMinutes: number;
  hourlyRate: number;
  totalPrice: number;
  securityDeposit: number;
};

function pdfText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7e]/g, " ")
    .replace(/[\\()]/g, "\\$&")
    .replace(/\s+/g, " ")
    .trim();
}

function wrap(value: string, maxLength = 76): string[] {
  const words = pdfText(value).split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (line && `${line} ${word}`.length > maxLength) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function money(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function createBookingInvoicePdf(booking: InvoiceBooking): Buffer {
  const details = [
    `Booking ID: ${booking.id}`,
    `Studio: ${booking.studioTitle}`,
    `Location: ${booking.studioLocation}`,
    `Date: ${booking.bookingDate}`,
    `Time: ${booking.startTime} - ${booking.endTime}`,
    `Guests: ${booking.numberOfPeople}`,
    `Duration: ${booking.durationMinutes} minutes`,
    `Hourly rate: ${money(booking.hourlyRate)}`,
    `Rental total: ${money(booking.totalPrice)}`,
    `Security deposit (separate): ${money(booking.securityDeposit)}`,
    "",
    "Booking status: Confirmed",
    "No payment was collected by StudioSpace. Confirm any payment arrangements directly with the host.",
  ].flatMap((line) => line ? wrap(line) : [""]);

  const commands = ["BT", "/F1 22 Tf", "50 748 Td", "(StudioSpace booking summary) Tj", "/F1 11 Tf"];
  for (const line of details) {
    commands.push("0 -25 Td", `(${line}) Tj`);
  }
  commands.push("ET");
  const stream = `${commands.join("\n")}\n`;

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}endstream`,
  ];

  let document = "%PDF-1.4\n% StudioSpace booking summary\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(document, "ascii"));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const crossReferenceOffset = Buffer.byteLength(document, "ascii");
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    document += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${crossReferenceOffset}\n%%EOF\n`;
  return Buffer.from(document, "ascii");
}
