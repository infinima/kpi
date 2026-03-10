import {useState} from "react";
import {DataTable} from "@/components/ui/DataTable";
import type {TableConfig, TableRowData} from "@/components/ui/data-table/types";

const config: TableConfig = {
    columns: [
        {
            key: "id",
            label: "ID",
            type: "text",
            width: 0.8,
            sortable: true,
            editable: false,
            searchable: true,
        },
        {
            key: "name",
            label: "Имя",
            type: "text",
            width: 1.6,
            sortable: true,
            editable: true,
            searchable: true,
            required: true,
        },
        {
            key: "age",
            label: "Возраст",
            type: "number",
            width: 1,
            sortable: true,
            editable: true,
            searchable: false,
        },
        {
            key: "email",
            label: "E-mail",
            type: "email",
            width: 1.8,
            sortable: true,
            editable: true,
            searchable: true,
        },
        {
            key: "status",
            label: "Статус",
            type: "select",
            width: 1.2,
            sortable: true,
            editable: true,
            searchable: true,
            options: [
                {label: "Активен", value: "active"},
                {label: "Неактивен", value: "inactive"},
                {label: "Заблокирован", value: "blocked"},
            ],
        },
    ],
};

const initialData: TableRowData[] = [
    {id: "1", name: "Иван", age: 22, email: "ivan@test.com", status: "active"},
    {id: "2", name: "Анна", age: 31, email: "anna@test.com", status: "inactive"},
    {id: "3", name: "Максим", age: 27, email: "max@test.com", status: "blocked"},
];

export default function ExamplePage() {
    const [rows, setRows] = useState<TableRowData[]>(initialData);

    const handleCreate = async (newRow: TableRowData) => {
        const rowWithId: TableRowData = {
            ...newRow,
            id: crypto.randomUUID(),
        };

        setRows((prev) => [...prev, rowWithId]);
    };

    const handleUpdate = async (updatedRow: TableRowData) => {
        setRows((prev) =>
            prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
        );
    };

    const handleDelete = async (rowToDelete: TableRowData) => {
        setRows((prev) => prev.filter((row) => row.id !== rowToDelete.id));
    };

    return (
        <div className="p-4">
            <DataTable
                config={config}
                data={rows}
                onCreate={handleCreate}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
            />
        </div>
    );
}
