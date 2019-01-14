/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Keyboard, AsyncStorage} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import colors from './src/color.js'
import TimePicker from './src/TimePicker.js'
import StopSearch from './src/StopSearch.js'
import ModalResult from './src/ModalResult.js';
import ModalSetting from './src/ModalSetting.js';

Date.prototype.addDays = function(days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}

class App extends Component {
  constructor() {
      super();

      this.state = {
          prepSetting: false,
          advanceSetting: false,
          timeArrival: {h: 0, m: 0},
          timePrepare: {h: 0, m: 0},
          timeAdvance: {h: 0, m: 0},
          startStop: null,
          endStop: null,
          modalVisible: false,
          modalSetting: false,
          alreadySearched: false,
          colorLoading: null,
          journeys: [],
          weather: [],
          fromAlreadySearched: false,
          settings: null,
          coord: null,
      }
      this.getGPSperm = false
      this.loadSettings()
  }

  loadSettings = async () => {
    try {
        let value = await AsyncStorage.getItem("@MorningRoute:Settings")
        if (value !== null) {
            this.setState({settings : JSON.parse(value)})
        }
    } catch (error) {console.log(error)}    
}

  getWantedArrivalDate = () => {
    const {timeAdvance, timeArrival, timePrepare} = this.state
    let today = new Date();
    let arrivalDate;
    if (today.getHours() > 3)
      arrivalDate = today.addDays(1)
    else
      arrivalDate = new Date(today)
    arrivalDate.setHours(timeArrival.h - timeAdvance.h)
    arrivalDate.setMinutes(timeArrival.m - timeAdvance.m)
    arrivalDate.setSeconds(0)
    return arrivalDate
  }


  searchJourneyAccurate = (urlBase, lastDeparture, wantedArrival, estimatedArrival) => {
    console.log("ESTIMED arrival : " + estimatedArrival.toString())
    const diff = (estimatedArrival.valueOf() - wantedArrival.valueOf()) / (1000 * 60)
    console.log("DIFFERENCE " + diff + "m")
    lastDeparture.setMinutes(lastDeparture.getMinutes() - diff)
    console.log("Reset depart to " + lastDeparture.toString())
    const newUrl = urlBase + "&firstDepartureDatetime=" + lastDeparture.getFullYear() + "-" + (lastDeparture.getMonth() + 1) + "-" + lastDeparture.getDate() + " " + lastDeparture.getHours() + ":" + lastDeparture.getMinutes()
    console.log(newUrl)
    this.setState({colorLoading: colors.secondaryDark})
    fetch(newUrl).then(r => r.json()).then(rep => {
      if (!rep.routePlannerResult.journeys) {
        this.setState({colorLoading: colors.cancel})
        return
      }
      console.log(rep.routePlannerResult.journeys[0].journey.arrivalDateTime.replace(" ", "T"))
      const estimatedArrival = this.tisseoDateToDate(rep.routePlannerResult.journeys[0].journey.arrivalDateTime)
      console.log("New estimed: " + estimatedArrival.toString())
      if (estimatedArrival.valueOf() > wantedArrival.valueOf())
        this.searchJourneyAccurate(urlBase, lastDeparture, wantedArrival, estimatedArrival)
      else {
        this.setState({modalVisible: true, fromAlreadySearched: false, alreadySearched: true, colorLoading: null, journeys: rep.routePlannerResult.journeys})
      }
    }).catch((e) => {
      console.log(e)
      this.setState({colorLoading: colors.cancel})
    })    
  }

  
  tisseoDateToDate = (string) => {
    const out = new Date(string.replace(" ", "T"))
    out.setHours(out.getHours() -1)
    return out
}
  searchJourney = () => {
    const start = (this.state.startStop.fromGPS) ? this.state.startStop : encodeURI(this.state.startStop.key)
    const end = encodeURI(this.state.endStop.key)

    this.setState({colorLoading: colors.secondaryLighter})
    this.getWeather()
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
        this.setState({colorLoading: colors.cancel})
        return
      }
      const journey = rep.routePlannerResult.journeys[0].journey
      this.searchJourneyAccurate(url,this.tisseoDateToDate(journey.departureDateTime) , this.getWantedArrivalDate(), this.tisseoDateToDate(journey.arrivalDateTime))
    })
    .catch((e) => {
      console.log(e)
      this.setState({colorLoading: colors.cancel})
    })
  }

  getWeather = () => {
    const weatherUrl = "https://www.prevision-meteo.ch/services/json/Toulouse"
    fetch(weatherUrl).then(r => r.json())
    .then(rep => {
      let data;
      const today = new Date()
      if (today.getHours() < 3)
        data = rep.fcst_day_0
      else
        data = rep.fcst_day_1
      let toSet = []
      for(i = 8; i <= 18; i += 2) {
        toSet.push(data.hourly_data[i + "H00"])
      }
      this.setState({weather: toSet})
    })
  }


  render() {
    const d = new Date();
    return (
        <View style={{position: "absolute", top: 0, bottom: 0, left: 0, right: 0, paddingTop: 30}}>
          <TouchableOpacity onPress={() => this.setState({modalSetting: true})} style={{position: "absolute", top: 5, right: 5, opacity: 0.5}}>
            <Icon name="cog"   size={20} color="grey" />
          </TouchableOpacity>
         {this.state.modalSetting && 
              <ModalSetting
                isVisible={this.state.modalSetting}
                onQuit={() => this.setState({modalSetting: false}, () => this.loadSettings())}/>}
         {this.state.modalVisible && 
          <ModalResult
          alreadySearched={this.state.fromAlreadySearched}
          journeys={this.state.journeys}
          prepareTime={this.state.timePrepare}
          weather={this.state.weather}
          isVisible={this.state.modalVisible}
          iGotLucky={this.state.settings.iGotLucky}
          createDepartureAlarm={this.state.settings.createDepartureAlarm}
          onQuit={() => this.setState({modalVisible: false})}/>}
          <View style={styles.inputRow}>
            <Icon name="flag-checkered" size={30} color={colors.secondaryLight} />
            <Text style={styles.text}>Heure d'arrivée</Text>
            <TimePicker style={{width: 100, backgroundColor: colors.mainLighter, borderRadius: 100, padding: 10, elevation: 10}}
            minH={0} maxH={10} minM={0} maxM={60} forceHour={true} setting="always" keySave={"timeArrival" + d.getDay()} jumpMin={1}
            onChange={(h, m) => this.setState({timeArrival: {h: h, m: m}, alreadySearched: false})}
            />
          </View>
          <View style={{height: 140, margin: 10, marginTop: 45}}>
            <StopSearch style={{bottom: 40}}
            allowGPS={true}
            onStartChanging={() => this.setState({startSetting: true, alreadySearched: false})}
            onEndChanging={() => this.setState({startSetting: false})}
            onChange={value => {console.log("OnChange: ", value); this.setState({startStop: value})}} keySave="StartStop" placeholder="Départ"/>
            {!this.state.startSetting && <>

            <Icon name="angle-double-down" style={{alignSelf: "center", margin: 5}} size={40} color={colors.secondaryDark} />
            <StopSearch style={{paddingTop: 50}}
            allowGPS={false}
            onStartChanging={() => this.setState({endSetting: true, alreadySearched: false})}
            onEndChanging={() => this.setState({endSetting: false})}
            onChange={value => this.setState({endStop: value})} keySave="EndStop" placeholder="Arrivée"/></>}
          </View>
          {(!this.state.startSetting && !this.state.endSetting) && 
          <View style={{}}>
            <View style={[styles.inputRow, {bottom: 50}]}>
              <Icon name="coffee" size={30} color={colors.secondaryLight} />
              {(!this.state.prepSetting) && <Text style={styles.text}>Préparation</Text>}
              <TimePicker style={{alignSelf: "flex-end", marginRight: 20}}
              minH={0} maxH={5} minM={0} maxM={60} forceHour={false} setting="switch" keySave="timePrepare"  jumpMin={5}
              onSetting={(state) => this.setState({prepSetting: state})}
              onChange={(h, m) => this.setState({timePrepare: {h: h, m: m}, alreadySearched: false})}
              />
            </View>
            <View style={[styles.inputRow, {bottom: 50}]}>
              <Icon name="fast-forward" size={30} color={colors.secondaryLight} />
              {(!this.state.advanceSetting) && <Text style={styles.text}>Avance</Text>}
              <TimePicker style={{alignSelf: "flex-end", marginRight: 20}}
              minH={0} maxH={5} minM={0} maxM={60} forceHour={false} setting="switch" keySave="timeAdvance" jumpMin={1}
              onSetting={(state) => this.setState({advanceSetting: state})}
              onChange={(h, m) => this.setState({timeAdvance: {h: h, m: m}, alreadySearched: false})}
              />
            </View>
          </View>}
          {(this.state.colorLoading !== null  && this.state.colorLoading !== colors.cancel) && 
            <ActivityIndicator style={styles.loading} size="large" color={this.state.colorLoading} />
          }
          {(this.state.colorLoading === colors.cancel) &&
            <Icon style={{alignSelf: "center"}} name="exclamation-triangle" size={60} color={this.state.colorLoading} />
          }
            {(!this.state.startSetting && !this.state.endSetting && (!this.state.colorLoading || this.state.colorLoading == colors.cancel)) && 
            <TouchableOpacity
              style={{position: "absolute", elevation: 20, bottom: 0, left: 0, right: 0, backgroundColor: colors.mainDark, padding: 5, height: 60, justifyContent: "center"}}
              onPress={() => {
                Keyboard.dismiss()
                if (this.state.alreadySearched)
                  this.setState({modalVisible: true, fromAlreadySearched: true})
                else
                  this.searchJourney()
              }} >
              <Text style={{color: "white", fontSize: 20, alignSelf: "center", fontStyle: "italic"}}>{(this.state.alreadySearched) ? "AFFICHER" : "WAKE ME UP !"}</Text>
            </TouchableOpacity>
            }          
        </View>
    );
  }
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems:'center',
    padding: 10,
  },
  loading: {
    transform : [
      {scaleX: 2},
      {scaleY: 2},
    ]
  },
  text: {
    color: colors.mainDark,
    fontSize: 20,
    marginRight: 30,
    marginLeft: 10,
    textAlign: 'left',
    flex: 1,
  },
  textInput: {
    bottom: 50,
  },
  modal: {
    margin: 30,
    backgroundColor: "white",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  }
});

export default App;

/*
TODO:
*/


/* 

PARIS

searc body: 
{"query":"montparnas","region_id":"fr-paris","is_refinement":true,"refinement_data":{"is_chain":true},"powersearch":false}
https://citymapper.com/api/4/searchpost

https://citymapper.3scale.net/docs
*/