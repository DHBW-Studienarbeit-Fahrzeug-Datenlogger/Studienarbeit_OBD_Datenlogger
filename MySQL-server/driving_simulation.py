"""
Created by: Maximilian Vogt
Version: 1.0

Description:


"""
import numpy as np
import mysql.connector as mysql_connector
import _env
import csv
import requests
import json


def get_field(table, name):
    """
    returns all entries of one field type
    (one column of table)
    uses setup.json to look up table format
    returns empty list if it didn't find matching column
    """
    with open('setup.json') as json_file:
        setup = json.load(json_file)
        field_list = []
        if name == "cars" or "CARS":
            field_list = setup("cars")
        i = 0
        field_counter = None
        for field in field_list:
            if field == name:
                field_counter = i
                break
            i = i+1
        if field_counter is not None:
            data = []
            for i in range(len(table)):
                data.append(table[i][field_counter])
            return data
        return []


def get_entry(table, identifier):
    """
        returns all fields of one entry
        (one row of table)
        returns empty list if it didn't find matching column
        """
    i=0
    j=0
    for row in table:
        for field in row:
            if field == identifier:
                return row , i, j
            j = j + 1
        i = i + 1
    return None , None, None


def read_table_from_database(cursor, table_name):
    """"
    returns nested list of all entries in database
    :param cursor: cursor to navigate database
    :type cursor: mysql-
    :param table_name: name of table to be retrieved from database
    :type table_name: str
    """"

    cursor.execute("SELECT name from" + table_name)
    row_list = []

    for element in cursor:
        row_list.append(element)

    return row_list


def driving_simulation(velocity, road_angle_rad, rolling_friction_factor, mass, mass_factor_rotations, projected_area, cw_factor, time):
    # constants, not vehicle or route dependent
    air_density = 1.2041
    gravitational_constant = 9.81

    l = len(velocity)
    acceleration = np.zeros(l)
    for i in range(l-1):
        acceleration[i] = (velocity[i+1] - velocity[i])/ (time[i+1] - time[i])

    force_roll = rolling_friction_factor * np.cos(road_angle_rad)
    force_pitch = np.sin(road_angle_rad) * mass * gravitational_constant
    force_inertia = mass * 9.81 * mass_factor_rotations * acceleration
    force_air_resistance = velocity**2 * projected_area * cw_factor * air_density

    force_drive = force_air_resistance + force_pitch + force_inertia + force_roll
    power_drive = force_drive[:] * velocity[:]
    energy_drive = np.zeros(l)
    for i in range(l-1):
        energy_drive[i+1] = energy_drive[i] + power_drive[i] * (time[i+1] - time[i])
    return power_drive, energy_drive


def heat_model(t_outside, t_inside, area, thickness, alpha_i, alpha_o, lambda_t, time):
    l = len(time)
    t_diff = t_outside - t_inside
    r_th_in = 1 / (alpha_i * area)
    r_th_out = 1 / (alpha_o * area)
    r_th_transfer = thickness / (lambda_t * area)
    r_th = r_th_in + r_th_out + r_th_transfer
    power_heat = t_diff / r_th
    energy_heat = np.zeros(l)
    for i in range(l-1):
        energy_heat[i+1] = energy_heat[i] + power_heat[i] * (time[i+1] - time[i])
    return  power_heat, energy_heat


def virtual_drive(car_id, route_id):
    """
    select car_id and route_id
    simulate drive of specific car on specific route
    save energy data to new table containing all route data and additionally car_id and file containing energy data

    :param car_id: String identifieing car in cars table
    :param route_id: String identifieing route in data table

    """
    try:
        db = mysql_connector.connect(
            user=_env.DB_USER,
            password=_env.DB_PASSWORD,
            host=_env.DB_HOST,
            database=_env.DB_NAME,
            # Necessary for mysql 8.0 to avoid an error because of encoding
            auth_plugin='mysql_native_password'
        )
    except Exception:
        db = mysql_connector.connect(
            user=_env.DB_USER,
            password=_env.DB_PASSWORD,
            host="127.0.0.1",
            database=_env.DB_NAME,
            # Necessary for mysql 8.0 to avoid an error because of encoding
            auth_plugin='mysql_native_password'
        )

        # Create execution object
    cursor = db.cursor()
    car_table = read_table_from_database(cursor=cursor, table_name="cars")
    car = get_entry(table=car_table, identifier="car_id")

    route_table = read_table_from_database(cursor=cursor, table_name="data")
    route_information = get_entry(table=route_table, identifier=route_id)

    height_profile_file=route_information[11]
    data_file=route_information[0]

    with open(height_profile_file) as json_file:
        height_profile_dict = json.load(json_file)
    with open(data_file) as json_file:
        route_data_dict = json.load(json_file)

    road_angle_rad = height_profile_dict["angle_rad"]
    velocity = route_data_dict["SPEED"]
    time = route_data_dict["TIME"]
    t_outside = route_data_dict["AMBIANT_AIR_TEMP"]
    t_inside = route_data_dict["INSIDE_AIR_TEMP"]
    consumption = car[2]
    capacity = car[3]
    max_power = car[4]
    cw_factor = car[6]
    projected_area = car[7]
    rolling_friction_factor = car[8]
    mass = car[9]
    mass_factor_rotations = car[10]
    area = car[11]
    alpha_i = car[13]
    alpha_o = car[14]
    lambda_trans = car[12]
    thickness = car[15]
    power_drive, energy_drive =  driving_simulation(
        velocity=velocity,
        road_angle_rad=road_angle_rad,
        rolling_friction_factor=rolling_friction_factor,
        mass=mass,
        mass_factor_rotations=mass_factor_rotations,
        projected_area=projected_area,
        cw_factor=cw_factor,
        time=time
    )
    power_heat, energy_heat = heat_model(
        t_outside=t_outside,
        t_inside=t_inside,
        area=area,
        thickness=thickness,
        alpha_i=alpha_i,
        alpha_o=alpha_o,
        lambda_t=lambda_trans,
        time=time
    )
    energy_data = {
        "power_heat": power_heat.tolist(),
        "energy_heat": energy_heat.tolist(),
        "power_drive": power_drive.tolist(),
        "energy_drive": energy_drive.tolist()
    }

    # write information to json file
    filename_energy_data = route_information[0][:-4] + "_energy_data.json"
    json.dump(energy_data, open(filename_energy_data, "w"), indent=4)

    ### Insert the driven route into the table
    cursor.execute(
        "INSERT INTO  simulations ( filename_raw_data, date, starttime, totalKM, endtime, VIN, fuelConsumption, " \
        + "energyConsumption, endLat, endLong, endDate, filename_height_profile) VALUES ('"
        + str(route_information[0]) \
        + "', '" + str(route_information[1]) + "', '" + str(route_information[2]) \
        + "', '" + str(route_information[3]) + "', '" + str(route_information[4]) \
        + "', '" + str(route_information[5]) + "', '" + str(route_information[6]) \
        + "', '" + str(route_information[7]) + "', '" + str(route_information[8]) \
        + "', '" + str(route_information[8]) \
        + "', '" + str(route_information[10]) + "', '" + str(route_information[11]) \
        + "', '" + str(car_id) \
        + "', '" + str(filename_energy_data) + "'")
    db.commit()


if __name__ == '__main__':
    virtual_drive(
        car_id=1,
        route_id=0
    )