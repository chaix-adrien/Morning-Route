import React, {Component} from 'react';
import {StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, ScrollView} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import city from "./city.js"
import colors from './color.js'

class toulouse extends city {
    getCityName = () => {
        return "Toulouse"
    }

    tisseoDateToDate = (string) => {
        const out = new Date(string.replace(" ", "T"))
        out.setHours(out.getHours() -1)
        return out
    }
    
    searchJourneyAccurate = (urlBase, lastDeparture, wantedArrival, estimatedArrival, succedCallback, failureCallback) => {
        console.log("ESTIMED arrival : " + estimatedArrival.toString())
        const diff = (estimatedArrival.valueOf() - wantedArrival.valueOf()) / (1000 * 60)
        console.log("DIFFERENCE " + diff + "m")
        lastDeparture.setMinutes(lastDeparture.getMinutes() - diff)
        console.log("Reset depart to " + lastDeparture.toString())
        const newUrl = urlBase + "&firstDepartureDatetime=" + lastDeparture.getFullYear() + "-" + (lastDeparture.getMonth() + 1) + "-" + lastDeparture.getDate() + " " + lastDeparture.getHours() + ":" + lastDeparture.getMinutes()
        console.log(newUrl)
        fetch(newUrl).then(r => r.json()).then(rep => {
          if (!rep.routePlannerResult.journeys) {
            failureCallback("no journey found")
            return
          }
          console.log(rep.routePlannerResult.journeys[0].journey.arrivalDateTime.replace(" ", "T"))
          const estimatedArrival = this.tisseoDateToDate(rep.routePlannerResult.journeys[0].journey.arrivalDateTime)
          console.log("New estimed: " + estimatedArrival.toString())
          if (estimatedArrival.valueOf() > wantedArrival.valueOf())
            this.searchJourneyAccurate(urlBase, lastDeparture, wantedArrival, estimatedArrival, succedCallback, failureCallback)
          else {
            succedCallback(rep.routePlannerResult.journeys.filter(j => j.journey))
          }
        }).catch((e) => failureCallback(e))    
    }

    searchJourney = (start, end, wantedArrival, succedCallback, failureCallback) => {
        start = (start.fromGPS) ? start : encodeURI(start.key)
        end = encodeURI(end.key)
        let url;
        console.log(start)
        if (start.fromGPS)
          url = "https://www.tisseo.fr/proxy/api/tisseo/v1/journeys.json?departurePlaceXY=" + start.longitude + "," + start.latitude + "&arrivalPlace=" + end + "&displayWording=1"      
        else
          url = "https://www.tisseo.fr/proxy/api/tisseo/v1/journeys.json?departurePlace=" + start + "&arrivalPlace=" + end + "&displayWording=1"
        console.log(url)
        fetch(url).then(rep => rep.json())
        .then(rep => {
          if (!rep.routePlannerResult.journeys) {
            failureCallback("no journey found")
            return
          }
          const journey = rep.routePlannerResult.journeys[0].journey
          //succedCallback(rep.routePlannerResult.journeys.filter(j => j.journey))
          this.searchJourneyAccurate(url,this.tisseoDateToDate(journey.departureDateTime) , wantedArrival, this.tisseoDateToDate(journey.arrivalDateTime), succedCallback, failureCallback)
        })
        .catch((e) => failureCallback(e))
    }
    
    searchAutocomplete = (search, succedCallback, failureCallback) => {
        fetch("https://www.tisseo.fr/proxy/api/tisseo/v1/places.json?displayBestPlace=1&lang=fr&simple=1&term=" + search).then(rep => rep.json())
        .then(rep => {
            let cat = ""
            rep = rep.splice(0, 8)
            rep.forEach((e, id) => {
                if (cat !== e.category) {
                    cat = e.category
                    rep.splice(id, 0, {category: cat, banner: true})
                }
            });
            succedCallback(rep)
        }).catch(e => failureCallback(e))
    }
    displayOneJourney = (journey) => {
        const out = [];
        let street = 0;
        journey.journey.chunks.forEach((step, id) => {
            if (id > 0 && street <= 1)
                out.push(<Icon key={id + "icon"} style={{margin: 5}} name="angle-double-down" size={20} color={colors.mainDark}/>)
            if (step.street && !street) {
                const time = step.street.departureTime.substring(0, 5)
                out.push(<Text key={id + "step"} style={[styles.stopText, {fontStyle: "italic"}]}>{time}</Text>)
                out.push(<Text key={id + "walk"} style={styles.stopText}>Marchez</Text>)
                street++
            } else if (step.street && street) {
                street++
                if (id === journey.journey.chunks.length - 1) {
                    const time = step.street.arrivalTime.substring(0, 5)
                    out.push(<Text key={id + "step"} style={[styles.stopText, {fontStyle: "italic"}]}>{time}</Text>)
                    out.push(<Text key={id + "walk"} style={styles.stopText}>Arrivée</Text>)
                }
            }
            if (step.stop) {
                street = 0
                out.push(<Text key={id + "step"} style={[styles.stopText, {fontStyle: "italic"}]}>{step.stop.firstTime}</Text>)
                out.push(<Text key={id + "step2"} style={styles.stopText}>{step.stop.text.text}</Text>)
            } else if (step.service) {
                street = 0
                const line = step.service.destinationStop.line
                out.push(<Text key={id + "text"} style={styles.stopText}>{step.service.text.text}</Text>)
                out.push(<Text key={id + "line"} style={[styles.lineIcon, {color: line.fgXmlColor, backgroundColor: line.bgXmlColor}]}>{line.shortName}</Text>)
            }
        })
        return {content: out, start: this.tisseoDateToDate(journey.journey.departureDateTime), end: this.tisseoDateToDate(journey.journey.arrivalDateTime)}
    }

    getTimesOfJourney = (journey) => {
        let times = {}
        times.arrival = this.tisseoDateToDate(journey.journey.arrivalDateTime)
        times.departure = this.tisseoDateToDate(journey.journey.departureDateTime)
        times.duration = new Date('December 17, 2019 ' + journey.journey.duration)
        return times
    }
}



styles = StyleSheet.create({
    lineIcon: {
        fontSize: 20,
        padding: 10,
        textAlign: "center",
        borderRadius: 10,
        margin: 5,
    },
    stopText: {
        textAlign: "center",
        fontSize: 15,
    },
})

export default toulouse