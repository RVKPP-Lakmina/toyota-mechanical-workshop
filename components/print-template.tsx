"use client";

import React from "react";
import type { Bill, Company } from "@/lib/database";

interface PrintTemplateProps {
  bill: Bill;
  company: Company;
}

export const PrintTemplate = React.forwardRef<
  HTMLDivElement,
  PrintTemplateProps
>(({ bill, company }, ref) => {
  const items = Array.isArray(bill.items) ? bill.items : [];

  return (
    <div ref={ref} className="p-8 bg-white text-black max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          {company.logoUrl && (
            <img
              src={company.logoUrl || "/placeholder.svg"}
              alt="Company Logo"
              className="h-16 w-16 object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <p className="text-sm text-gray-600">{company.address}</p>
            <p className="text-sm text-gray-600">Phone: {company.phone}</p>
            <p className="text-sm text-gray-600">Email: {company.email}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-blue-600">
            {bill.type === "bill" ? "INVOICE" : "QUOTATION"}
          </h2>
          <p className="text-sm">#{bill.billNumber}</p>
          <p className="text-sm">
            Date: {new Date(bill.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Customer Information */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Bill To:</h3>
        <div className="bg-gray-50 p-4 rounded">
          <p className="font-medium">{bill.customerName}</p>
          <p className="text-sm">Phone: {bill.customerPhone}</p>
          {bill.customerAddress && (
            <p className="text-sm">Address: {bill.customerAddress}</p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Item</th>
              <th className="border border-gray-300 p-2 text-left">Code</th>
              <th className="border border-gray-300 p-2 text-right">
                Unit Price
              </th>
              <th className="border border-gray-300 p-2 text-right">Qty</th>
              <th className="border border-gray-300 p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, index: number) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">{item.partName}</td>
                <td className="border border-gray-300 p-2">{item.partCode}</td>
                <td className="border border-gray-300 p-2 text-right">
                  Rs. {Number.parseFloat(item.unitPrice).toFixed(2)}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  {item.quantity}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  Rs. {Number.parseFloat(item.total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-1">
            <span>Subtotal:</span>
            <span>Rs. {Number.parseFloat(bill.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Tax ({Number.parseFloat(bill.taxRate)}%):</span>
            <span>Rs. {Number.parseFloat(bill.taxAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t border-gray-300 font-bold text-lg">
            <span>Total:</span>
            <span>Rs. {Number.parseFloat(bill.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {bill.notes && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Notes:</h3>
          <p className="text-sm bg-gray-50 p-4 rounded">{bill.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 border-t pt-4">
        <p>Thank you for your business!</p>
        <p>
          This {bill.type} was generated on {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
});

PrintTemplate.displayName = "PrintTemplate";
