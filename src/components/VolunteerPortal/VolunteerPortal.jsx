import React, { Component } from 'react';
import { Button } from '@material-ui/core';
import Dropdown from './Dropdown'
import DateTime from './DateTime'
import NameSearch from './NameSearch'
import PortalCard from './PortalCard'
import './VolunteerPortal.css'
import axios from 'axios';
import moment from 'moment'

class VolunteerPortal extends Component {
    state = {
        // dateInput: '',
        // timeInput: '',
        // departmentInput: '',
        // nameInput: ''
    }
    componentDidMount() {
        this.getVolunteerNames();
        this.getShifts();
        this.getDepartments();
    }

    removeVolunteer = (shift) => {
        // console.log('removed volunteer from: ', ShiftID);
        axios.put(`/api/volunteer-portal/remove-volunteer/${shift.ShiftID}`)
            .then(response => {
                console.log(response);
                this.getShifts();
            }).catch(error => {
                console.log(error)
            })
    }

    addVolunteer = (shift, name) => {
        // console.log(`adding ${name.VolunteerName} to shift: ${shift.ShiftID}`);
        axios.put(`/api/volunteer-portal/add-volunteer/${shift.ShiftID}`, name)
            .then(response => {
                console.log(response);
                this.getShifts();
            }).catch(error => {
                console.log(error);
            })
    }

    //-------populates card data -------//
    getShifts = () => {
        axios.get('/api/volunteer-portal/shifts')
            .then(response => {
                this.setState({
                    ...this.state,
                    displayData: response.data,
                    allData: response.data
                })
            }).catch(error => {
                console.log(error)
            })
    }

    //-----set state to filter inputs--------//
    storeNameInState = (name) => {
        // console.log(name)
        this.setState({
            ...this.state,
            nameInput: name
        })
    }
    storeDepartmentInState = (department) => {
        // console.log(department)
        this.setState({
            ...this.state,
            departmentInput: department
        })
    }
    storeShiftDateTimeInState = (d, t) => {
        if (d) {
            let date = moment(d).format('YYYY-MM-DD')
            console.log(d, date)
            this.setState({
                ...this.state,
                dateInput: date
            })
        }
        if (t) {
            let time = moment(t).format('H:mm') + ':00'
            // console.log(time)
            this.setState({
                ...this.state,
                timeInput: time
            })
        }
    }

    // ----- populate dropdowns ----//
    getVolunteerNames = () => {
        axios.get('/api/volunteer-portal/volunteer-names')
            .then(response => {
                this.setState({
                    ...this.state,
                    names: response.data
                })
                // console.log(response.data)
            }).catch(error => {
                console.log(error)
            })
    }
    getDepartments = () => {
        axios.get('/api/volunteer-portal/departments')
            .then(response => {
                // console.log(response.data)
                this.setState({
                    ...this.state,
                    departments: response.data
                })
            }).catch(error => {
                console.log(error)
            })
    }

    //---------apply filters-----//
    applyFilters = (date, time, dept, name) => {
        const allData = this.state.allData;
        if (!date && !time && !dept && !name) {
            this.setState({
                ...this.state,
                displayData: this.state.allData
            })
            console.log('no filters applied')
        }
        console.log('Date: ', date, 'Time: ', time, 'Department: ', dept, 'Name ', name)
        let filteredData = [...allData];
        if (date) {
            let filteredByDate = []
            filteredData.forEach(data => {
                if (moment(data.ShiftDate).format('YYYY-MM-DD') === date){
                    console.log('true', date)
                    filteredByDate.push(data)
                }
            })
                filteredData = filteredByDate;
            
        }
        if (time) {
            let filteredByTime = []
            filteredData.forEach(data => {
                if (moment(data.ShiftTime).format('H:mm') + ':00' === time) {
                    console.log('true', time)
                    filteredByTime.push(data)
                }
            })
                filteredData = filteredByTime
        
        }
        if (name) {
            let filteredByName = []
            filteredData.forEach(data => {
                data.Shifts.forEach(shift => {
                    if (shift.BadgeNumber == name.BadgeNumber){
                        console.log('true', name)
                        filteredByName.push(data)
                    }
                })
            })
                filteredData = filteredByName
            
        }
        if (dept) {
            let filteredByDept = []
            filteredData.forEach(data => {
                if (data.DepartmentName === dept.DepartmentName) {
                    console.log('true', dept)
                    filteredByDept.push(data)
                }
            })
                filteredData = filteredByDept
            
        } 
        this.setState({
            ...this.state,
            displayData: filteredData
        })
    }

    //-------render------//
    render() {
        return (
            <div className="VolunteerPortal">
                <DateTime
                    storeShiftDateTimeInState={this.storeShiftDateTimeInState}
                />
                <br />
                {this.state.departments ?
                    <Dropdown
                        title='Department'
                        options={this.state.departments}
                        keyName='DepartmentName'
                        storeDropdownInState={this.storeDepartmentInState}
                        departmentInput={this.state.departmentInput}
                    />
                    : <Dropdown
                        title='Department'
                        options={[{ DepartmentName: 'Loading . . .' }]}
                        keyName='DepartmentName'
                        storeDropdownInState={this.storeDepartmentInState}
                        departmentInput={this.state.departmentInput}
                    />}
                {this.state.names ?
                    <NameSearch
                        nameSuggestions={this.state.names}
                        storeNameInState={this.storeNameInState}
                        nameInput={this.state.nameInput}
                    />
                    :
                    <NameSearch
                        nameSuggestions={[{ VolunteerName: 'Loading . . .' }]}
                        storeNameInState={this.storeNameInState}
                        nameInput={this.state.nameInput}
                    />}
                <br />
                <div className='filter-buttons'>
                    <Button
                        onClick={() => this.applyFilters(this.state.dateInput, this.state.timeInput, this.state.departmentInput, this.state.nameInput)}
                        variant="outlined"
                        color="inheret">
                        Apply Filters
                    </Button>
                    <Button
                        onClick={() => this.applyFilters(null, null, null, null)}
                        color="inheret">
                        Clear Filters
                    </Button>
                </div>
                {this.state.displayData ?
                    this.state.displayData.map(department => {
                        let shiftAssignments = department.Shifts
                        shiftAssignments.forEach(shift => {
                            if (shift.BadgeNumber) {
                                this.state.names.forEach(name => {
                                    if (name.BadgeNumber === shift.BadgeNumber) {
                                        shift.BadgeNumber = { badgeNumber: shift.BadgeNumber, name: name.VolunteerName }
                                    }
                                })
                            }
                            department.Roles.forEach(role => {
                                if (role.RoleID === shift.RoleID) {
                                    shift.RoleID = { roleID: shift.RoleID, roleName: role.RoleName }
                                }
                            })
                        })
                        return <PortalCard
                            department={department.DepartmentName}
                            date={department.ShiftDate}
                            time={department.ShiftTime}
                            shifts={shiftAssignments}
                            removeVolunteer={this.removeVolunteer}
                            addVolunteer={this.addVolunteer}
                            state={this.state}

                        />
                    }) : null}
            </div>
        );
    }
}

export default VolunteerPortal;
