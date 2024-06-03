"use client";

import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { PiLegoSmiley, PiLegoSmileyDuotone, PiLegoSmileyThin } from "react-icons/pi";
import CpInput from "./Input";

interface Data {
  _id: string
  name: string
  tier: string
  segment: string
  active: boolean
}

const columns = [
	{
		name: "Name",
		selector: (row: Data) => row.name,
    sortable: true,
    // onclick: (row: Data) => console.log("row"),
    // conditionalCellStyles: [
    //   {
    //     when: (row: Data) => true,
    //     classNames: ["cursor-pointer"],
    //   }
    // ]
	},
	{
		name: "Tier",
		selector: (row: Data) => row.tier,
    sortable: true,
    // right: true,
	},
	{
		name: "Segment",
		selector: (row: Data) => row.segment,
    sortable: true,
    // right: true,
	},
  // {
  //   name: "Actions",
  //   selector: () => <HiPencilAlt size={15} /> as any,
  //   sortable: false,
  //   right: true,
  //   width: "10%"
  // }
];

const conditionalRowStyles = [
  {
    when: () => true,
    classNames: ["hover:bg-slate-200 capitalize cursor-pointer"],
  },
  {
    when: (row: Data) => !row.active,
    style: {
      color: "rgb(239, 68, 68)",
    },
  }
];

export default function AllVolunteers({data}: {data: Data[]}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const isAdmin = false;

  const filteredVolunteers = useMemo(() => {
    const filteredValues = data.filter((volunteer) => {
      return volunteer.name.toLowerCase().includes(query.toLowerCase());
    });

    if (isAdmin && query === '') return data;
    if (isAdmin) return filteredValues;
    if (filteredValues.length === 1) return filteredValues;
    return [];
  }, [query])

  const noDataMessage = () => {
    if (isAdmin) return "There are no records to display";
    return "You're on guest mode. Please search for your name to view your profile";
  }

  return (
    <Fragment>
      <div className="flex justify-between">
        <h2 className="text-lg uppercase text-slate-700">Volunteers List</h2>
        <div className="w-1/3">
          <CpInput onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredVolunteers}
        conditionalRowStyles={conditionalRowStyles}
        pagination={isAdmin}
        onRowClicked={(row: Data) => router.push(`/volunteer/profile/${row._id}`)}
        noDataComponent={
          <div className="flex h-96 flex-col justify-center">
            <div className="flex gap-1 text-slate-700">
              <PiLegoSmileyDuotone size={27} />
              <div className="flex flex-col justify-center">{noDataMessage()}</div>
              <PiLegoSmiley size={27} />
            </div>
          </div>
        }
      />
    </Fragment>
  )
}
