"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Download, 
  Eye, 
  Calendar as CalendarIcon,
  Filter,
  X
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { RentalDetailsModal } from "./rental-details-modal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface RentalHistoryTableProps {
  initialRentals: any[];
}

export function RentalHistoryTable({ initialRentals }: RentalHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedRental, setSelectedRental] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter logic
  const filteredRentals = initialRentals.filter((rental) => {
    const matchesSearch = 
      rental.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.customerPhone.includes(searchQuery) ||
      (rental.vehicleId?.plateNumber && rental.vehicleId.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const rentalDate = new Date(rental.startTime);
    let matchesDate = true;
    if (dateRange?.from) {
      matchesDate = isWithinInterval(rentalDate, {
        start: dateRange.from,
        end: dateRange.to || dateRange.from,
      });
    }

    return matchesSearch && matchesDate;
  });

  const totalRevenue = filteredRentals.reduce((sum, rental) => sum + rental.totalAmount, 0);

  const setPresetRange = (range: "7d" | "30d" | "month") => {
    const today = new Date();
    if (range === "7d") {
      setDateRange({ from: subDays(today, 7), to: today });
    } else if (range === "30d") {
      setDateRange({ from: subDays(today, 30), to: today });
    } else if (range === "month") {
      setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Date", "Customer Name", "Phone", "Vehicle", "Plate Number", "Total Amount", "Payment Status"
    ];
    
    const rows = filteredRentals.map(rental => [
      format(new Date(rental.startTime), "yyyy-MM-dd"),
      rental.customerName,
      rental.customerPhone,
      `${rental.vehicleId?.make} ${rental.vehicleId?.model}`,
      rental.vehicleId?.plateNumber,
      rental.totalAmount,
      rental.paymentStatus
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rental_history_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRowClick = (rental: any) => {
    setSelectedRental(rental);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-2 w-full">
          <div className="relative w-full md:max-w-[300px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Name, Phone or Plate..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-3 text-xs"
              onClick={() => setPresetRange("7d")}
            >
              Last 7 Days
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-3 text-xs"
              onClick={() => setPresetRange("30d")}
            >
              Last 30 Days
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-3 text-xs"
              onClick={() => setPresetRange("month")}
            >
              This Month
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger render={
                <Button variant="outline" className={cn(
                  "justify-start text-left font-normal px-3 h-9 text-xs",
                  !dateRange && "text-muted-foreground"
                )}>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd")}`
                    ) : (
                      format(dateRange.from, "LLL dd")
                    )
                  ) : (
                    "Custom Range"
                  )}
                </Button>
              } />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {dateRange && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9" 
                onClick={() => setDateRange(undefined)}
                title="Clear date filter"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={exportToCSV} className="flex-1 md:flex-none h-9">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <div className="min-w-[800px] md:min-w-full">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRentals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No rental records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRentals.map((rental) => (
                <TableRow key={rental._id} className="cursor-pointer" onClick={() => handleRowClick(rental)}>
                  <TableCell className="font-medium">
                    {format(new Date(rental.startTime), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">{rental.customerName}</span>
                      <span className="text-xs text-muted-foreground">{rental.customerPhone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">{rental.vehicleId?.make} {rental.vehicleId?.model}</span>
                      <span className="text-xs text-muted-foreground">{rental.vehicleId?.plateNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ₹{rental.totalAmount}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rental.paymentStatus === "Paid" ? "default" : "destructive"}>
                      {rental.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center border">
         <div className="flex gap-4">
            <div className="text-sm">
                <span className="text-muted-foreground">Total Records:</span>
                <span className="ml-2 font-bold">{filteredRentals.length}</span>
            </div>
         </div>
         <div className="text-sm">
            <span className="text-muted-foreground">Total Revenue:</span>
            <span className="ml-2 text-lg font-bold text-primary italic">₹{totalRevenue.toLocaleString("en-IN")}</span>
         </div>
      </div>

      <RentalDetailsModal
        rental={selectedRental}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
