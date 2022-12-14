import { useRecoilState } from "recoil";
import { selectedFacility } from "../states/FacilitiesAtom";
import { useEffect, useState } from "react";
import { createUseStyles } from "react-jss";
import {
  filteredActivities,
  activityTags,
  currentActivities,
  currentActivityTag,
} from "../states/ActivitiesAtom";

import Activity from "../components/Activity";
import SearchBar from "../components/SearchBar";
import DropDown from "../components/DropDown";
import ClearButton from "../components/ClearButton";

import { activityQuery } from "../states/FuseAtom";
import Fuse from "fuse.js";

const useStyles = createUseStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    marginTop: "50px",
    marginLeft: "20px",
    backgroundColor: "white",
    padding: "10px",
    borderRadius: "0.2rem",
  },
  row: {
    display: "flex",
    marginBottom: "10px",
  },
  time: {
    fontFamily: "'Roboto', sans-serif",
    fontSize: "1rem",
    color: "#808080",
    marginRight: "10px",
    width: "5rem",
  },
  title: {
    fontSize: "1.5rem",
    fontFamily: "'Roboto', sans-serif",
    textAlign: "left",
    marginLeft: "1rem",
    color: "#8c59f8",
  },
  filterWrapper: { display: "flex", flexDirection: "row", padding: "10px" },
});

function Activities() {
  const classes = useStyles();

  const [timeTable, setTimeTable] = useState();
  const [uniqueTimes, setUniqueTimes] = useState();
  const [tagResults, setTagResults] = useState([]);

  const [facility] = useRecoilState(selectedFacility);
  const [searchedActivities, setSearchedActivities] =
    useRecoilState(filteredActivities);
  const [currActivities] = useRecoilState(currentActivities);
  const [activityTag, setCurrentActivityTag] =
    useRecoilState(currentActivityTag);
  const [activityTagsList] = useRecoilState(activityTags);
  const [actQuery, setActivityQuery] = useRecoilState(activityQuery);

  //Fuzzy search
  const options = {
    includeScore: true,
    threshold: 0.2,
    keys: ["name", "tags.name", "level", "location"],
  };

  useEffect(() => {
    sortActivities(currActivities);
  }, [facility]);

  useEffect(() => {
    if (actQuery.length === 0) {
      activityTag.length === 0
        ? sortActivities(currActivities)
        : sortActivities(tagResults);
      return;
    }

    let fuse;

    activityTag.length === 0
      ? (fuse = new Fuse(currActivities, options))
      : (fuse = new Fuse(tagResults, options));

    const fuseResult = fuse.search(actQuery);

    setSearchedActivities([]);

    fuseResult.forEach((result) => {
      setSearchedActivities((searchedActivities) => [
        ...searchedActivities,
        result.item,
      ]);
    });
  }, [actQuery]);

  useEffect(() => {
    if (!(actQuery.length === 0)) {
      sortActivities(searchedActivities);
    }
  }, [searchedActivities]);

  //When dropdown is changed
  useEffect(() => {
    //When dropdown is changed whilst search is not empty
    if (actQuery.length !== 0) {
      setActivityQuery("");
    }
    //When it's not empty
    if (!(activityTag.length === 0)) {
      let newArray = currActivities.filter(checkTags);
      setTagResults(newArray);
      sortActivities(newArray);
    } else {
      //When dropdown clear is clicked
      sortActivities(currActivities);
    }
  }, [activityTag]);

  //Check if an activity contains the tag from dropdown
  const checkTags = (activity) =>
    activity.tags.some((tag) => tag.name === activityTag);

  //Used to sort activities by starting time
  const sortActivities = (array) => {
    let tempArray = [...array];

    tempArray.sort(function (a, b) {
      let a_time = fixTime(a.start_time);
      let b_time = fixTime(b.start_time);
      return a_time.localeCompare(b_time);
    });

    let activitiesMap = new Map();
    let times = new Set();

    tempArray.forEach((activity) => {
      if (activitiesMap.get(activity.start_time)) {
        let temp = activitiesMap.get(activity.start_time);
        temp.push(activity);
        activitiesMap.set(activity.start_time, temp);
      } else {
        times.add(activity.start_time);
        activitiesMap.set(activity.start_time, [activity]);
      }
    });

    setTimeTable(activitiesMap);
    setUniqueTimes(Array.from(times));
  };

  //Return activities that start a given time
  const returnActivities = (time) => timeTable.get(time);

  //To fix the issue with no leading zeroes
  const fixTime = (time) => (time.length !== 5 ? "0" + time : time);

  return (
    uniqueTimes && (
      <div className={classes.container}>
        <div className={classes.title}>Activities</div>
        <div className={classes.filterWrapper}>
          <ClearButton setter={setCurrentActivityTag}></ClearButton>
          <DropDown
            tags={activityTagsList}
            setter={setCurrentActivityTag}
            currentTag={activityTag}
          ></DropDown>
          <SearchBar
            value={actQuery}
            setter={setActivityQuery}
            label={"Activity"}
          ></SearchBar>
        </div>
        {uniqueTimes.map((time) => (
          <div key={time} className={classes.row}>
            <div className={classes.time}>{time}</div>
            {returnActivities(time).map((activity) => (
              <Activity key={activity.id} activity={activity}></Activity>
            ))}
          </div>
        ))}
      </div>
    )
  );
}

export default Activities;
