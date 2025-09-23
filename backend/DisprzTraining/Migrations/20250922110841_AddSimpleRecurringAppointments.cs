using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DisprzTraining.Migrations
{
    /// <inheritdoc />
    public partial class AddSimpleRecurringAppointments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRecurring",
                table: "Appointments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ParentAppointmentId",
                table: "Appointments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RecurrenceEndDate",
                table: "Appointments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceInterval",
                table: "Appointments",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRecurring",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "ParentAppointmentId",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "RecurrenceEndDate",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "RecurrenceInterval",
                table: "Appointments");
        }
    }
}
