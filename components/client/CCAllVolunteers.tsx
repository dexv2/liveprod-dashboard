"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { PiLegoSmiley, PiLegoSmileyDuotone } from "react-icons/pi";
import GCInputSearch from "@/components/global/GCInputSearch";
import { IoPersonAdd } from "react-icons/io5";
import { Tooltip } from "react-tooltip";
import { RiDeleteBinLine } from "react-icons/ri";
import { deleteVolunteer } from "@/utils/apis/delete";
import { toast } from "react-toastify";
import { sleep } from "@/utils/helpers";
import { category, VIEW_VOLUNTEERS_LISTS, ADD_VOLUNTEER, DELETE_VOLUNTEER_DATA } from "@/utils/constants";
import { useSession } from 'next-auth/react';

interface Data {
  _id: string
  name: string
  firstName: string
  lastName: string
  nickName: string
  status: string
  segment: string
  gender: string
  roles: string[]
  active: boolean
}

interface Columns {
  name: string
  selector: (row: Data) => string
  sortable: boolean
  button?: boolean
  width?: string
  wrap?: boolean
}

const conditionalRowStyles = [
  {
    when: () => true,
    classNames: ["hover:bg-slate-200 capitalize cursor-pointer"],
    style: {
      color: "#334155"
    }
  },
  {
    when: (row: Data) => row.status === "inactive",
    style: {
      color: "rgb(239, 68, 68)",
    },
  }
];

export default function CCAllVolunteers({ data }: { data: Data[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const hasViewVolunteerListsPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(VIEW_VOLUNTEERS_LISTS);
  }, [session]);

  const hasAddVolunteerPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(ADD_VOLUNTEER);
  }, [session]);

  const hasDeleteVolunteerPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(DELETE_VOLUNTEER_DATA);
  }, [session]);

  const deleteVol = async (volunteerId: string, volunteerName: string) => {
    const confirmed = confirm(`Are you sure you want to remove ${volunteerName} as volunteer?`);
    if (!confirmed) return;

    try {
      const res = await deleteVolunteer(volunteerId);
      if (res.success) {
        toast.info(res.message);
      }
    } catch (error) {
      toast.error("Failed to remove volunteer!");
    } finally {
      await sleep(1000);
      router.refresh();
    }
  }

  const columns: Columns[] = [
    {
      name: "First Name",
      selector: (row: Data) => row.firstName,
      sortable: true,
    },
    {
      name: "Last Name",
      selector: (row: Data) => row.lastName,
      sortable: true,
    },
    {
      name: "Nickname",
      selector: (row: Data) => row.nickName || "--",
      sortable: true,
    },
    {
      name: "Segment",
      selector: (row: Data) => row.segment,
      sortable: true,
    },
  ];

  if (hasViewVolunteerListsPermission) {
    columns.splice(0, 0, {
      name: "ID",
      selector: (row: Data) => {
        const volunteerId = (row as any).volunteerId;
        return volunteerId ? volunteerId : "Not Assigned";
      },
      sortable: true,
      width: "140px",
      wrap: true
    });
  }

  if (hasViewVolunteerListsPermission) {
    columns.push(
      {
        name: "Gender",
        selector: (row: Data) => row.gender,
        sortable: true,
      },
      {
        name: "Status",
        selector: (row: Data) => row.status,
        sortable: true,
      },
      {
        name: "Roles",
        selector: (row: Data) => row.roles?.join(', ') || '--',
        sortable: true,
        width: '250px',
        wrap: true,
      }
    );
  }

  if (hasDeleteVolunteerPermission) {
    columns.push({
      name: "Actions",
      selector: (row: Data) => <RiDeleteBinLine className="text-rose-600" onClick={() => deleteVol(row._id, row.name)} size={18} /> as any,
      sortable: false,
      button: true,
    })
  }

  const filteredVolunteers = useMemo(() => {
    if (!hasViewVolunteerListsPermission) {
      return []; // Non-admin users see no volunteers in the list
    }
    
    const filteredValues = data.filter((volunteer) => {
      const matchesQuery = volunteer.name.toLowerCase().includes(query.toLowerCase());
      const matchesGender = !genderFilter || volunteer.gender === genderFilter;
      const matchesStatus = !statusFilter || volunteer.status === statusFilter;
      const matchesRole = !roleFilter || volunteer.roles?.some(role => role.toLowerCase() === roleFilter.toLowerCase());
      
      return matchesQuery && matchesGender && matchesStatus && matchesRole;
    });

    if (query === '' && !genderFilter && !statusFilter && !roleFilter) return data;
    return filteredValues;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, genderFilter, statusFilter, roleFilter, hasViewVolunteerListsPermission, data])

  const noDataMessage = () => {
    if (hasViewVolunteerListsPermission) return "There are no records to display";
    return "Enter your Volunteer ID above to access your profile";
  }

  const openModal = () => {
    router.push("/volunteer/add");
  }

  return (
    <div className="flex justify-center">
      <div className="w-full">
        <div className="flex flex-col gap-7 text-slate-700 px-4 md:px-16 lg:px-32 pt-8">
          <div className="flex flex-col md:flex-row md:justify-between items-start md:items-end mb-6 gap-4">
            {hasViewVolunteerListsPermission && (
              <div className="flex flex-wrap gap-2 md:gap-3 items-end w-full md:w-auto">
                <div className="min-w-[100px] md:min-w-[120px]">
                  <label className="block text-xs md:text-sm mb-1 text-white">Gender</label>
                  <select 
                    value={genderFilter} 
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="w-full p-1 md:p-2 border border-gray-300 rounded h-8 md:h-10 text-sm"
                  >
                    <option value="">All Genders</option>
                    {category.GENDER.map(gender => (
                      <option key={gender} value={gender}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[100px] md:min-w-[120px]">
                  <label className="block text-xs md:text-sm mb-1 text-white">Status</label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-1 md:p-2 border border-gray-300 rounded h-8 md:h-10 text-sm"
                  >
                    <option value="">All Status</option>
                    {category.STATUS.map(status => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[140px] md:min-w-[180px]">
                  <label className="block text-xs md:text-sm mb-1 text-white">Role</label>
                  <select 
                    value={roleFilter} 
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full p-1 md:p-2 border border-gray-300 rounded h-8 md:h-10 text-sm"
                  >
                    <option value="">All Roles</option>
                    {category.ROLES.map(role => (
                      <option key={role} value={role}>{role.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    setGenderFilter('');
                    setStatusFilter('');
                    setRoleFilter('');
                    setQuery('');
                  }}
                  className="px-2 md:px-3 py-1 md:py-2 bg-slate-800 border border-slate-600 text-white rounded hover:bg-slate-700 h-8 md:h-10 text-xs md:text-sm"
                >
                  Reset
                </button>
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-2 md:gap-3 items-stretch md:items-end w-full md:w-auto">
              {hasViewVolunteerListsPermission ? (
                <div className="w-full md:w-64">
                  <GCInputSearch onChange={(event) => setQuery(event.target.value)} />
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-end w-full">
                  <div className="w-full md:w-80">
                    <label className="block text-xs md:text-sm font-medium mb-1 text-white">Enter Volunteer ID</label>
                    <input
                      type="text"
                      placeholder="A123456 / S123456 / L123456"
                      className="w-full p-2 border border-gray-300 rounded h-8 md:h-10 text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const volunteerId = (e.target as HTMLInputElement).value.trim();
                          if (volunteerId) {
                            router.push(`/volunteer/id/${volunteerId}`);
                          }
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="A123456 / S123456 / L123456"]') as HTMLInputElement;
                      const volunteerId = input?.value.trim();
                      if (volunteerId) {
                        router.push(`/volunteer/id/${volunteerId}`);
                      }
                    }}
                    className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded hover:bg-blue-700 h-8 md:h-10 text-sm"
                  >
                    Go
                  </button>
                </div>
              )}
              { hasAddVolunteerPermission &&
                <button
                  onClick={openModal}
                  id="add-volunteer"
                  className="flex flex-col justify-center bg-sky-600 py-1 px-2 rounded-xl h-8 md:h-10"
                >
                  <IoPersonAdd size={24} className="text-slate-50" />
                </button>
              }
            </div>
          </div>
          <div className={`${hasViewVolunteerListsPermission && !!filteredVolunteers.length ? "border border-slate-200" : ""} rounded-md`}>
            <DataTable
              columns={columns}
              data={filteredVolunteers}
              conditionalRowStyles={conditionalRowStyles}
              pagination={hasViewVolunteerListsPermission}
              responsive
              {...(hasViewVolunteerListsPermission && {
                paginationPerPage: 25,
                paginationRowsPerPageOptions: [10, 25, 50, 100]
              })}
              onRowClicked={hasViewVolunteerListsPermission ? (row: Data) => router.push(`/volunteer/profile/${row._id}`) : undefined}
              noDataComponent={
                <div className="flex h-96 flex-col justify-center">
                  <div className="flex gap-1 text-white">
                    <PiLegoSmileyDuotone size={27} />
                    <div className="flex flex-col justify-center">{noDataMessage()}</div>
                    <PiLegoSmiley size={27} />
                  </div>
                </div>
              }
              customStyles={{
                headCells: {
                  style: {
                    color: "white",
                    backgroundColor: "#1e293b"
                  }
                },
                rows: {
                  style: {
                    minHeight: "2.8rem"
                  }
                },
                table: {
                  style: {
                    backgroundColor: "transparent"
                  }
                },
                // tableWrapper: {
                //   style: {
                //     backgroundColor: "transparent"
                //   }
                // },
                noData: {
                  style: {
                    backgroundColor: "transparent"
                  }
                }
              }}
            />
          </div>
        </div>
        <Tooltip variant="info" anchorSelect="#add-volunteer" place="top-end">Add Volunteer</Tooltip>
      </div>
    </div>
  )
}
