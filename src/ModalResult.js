import React, {Component} from 'react';
import {StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, ScrollView} from 'react-native';
import RNAlarm from 'react-native-alarm-clock';
import Swiper from 'react-native-swiper';

import Icon from 'react-native-vector-icons/FontAwesome5';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';

import Modal from "react-native-modal";
import colors from './color.js'

let lastState = null;

class ModalResult extends Component {
    constructor(props) {
        super(props)
        console.log("ALREADY SEARCHED " + props.alreadySearched)
        this.state = (lastState && props.alreadySearched) ? lastState : {
            journeySelected:  null,
            times: null,
        }
        this.tmpIndex = 0;
        
    }

    componentWillMount() {
        const {journeys, iGotLucky} = this.props
        if (journeys.length === 1  || iGotLucky)
            this.selectJourney(0)

    }

    componentWillUnmount() {
        lastState = this.state
    }

    dateToTimeString = (date) => {
        let str = date.toLocaleTimeString("fr-FR")
        str = str.split(":")
        str.splice(-1, 1)
        str = str[0] + "h" + str[1]
        
        return str
    }

    displayTime = (time, icon, text, decal = 0) =>  {
        return (
            <View style={styles.inputRow}>
                <View style={styles.row}>
                    <Icon name={icon} size={30}  style={[styles.iconText, {left: decal}]} color={colors.secondaryLight} />
                    <Text style={styles.textTime}>{this.dateToTimeString(time)}</Text>
                </View>
                <Text style={styles.text}>{text}</Text>
            </View>
        )
    }

    displayWeather = (id, hour) => {
        const {weather} = this.props
        return (
            <View style={styles.row}>
                    <Image style={{width: 50, height: 50}} source={{uri: weather[id]["ICON"]}}/>
                    <View>
                        <Text style={styles.weatherTime}>{hour + "h"}</Text>
                        <Text style={styles.textWeather}>{weather[id]["TMP2m"] + "°C"}</Text>
                    </View>
            </View>
        )
    }

    displayResult = () => {
        const {weather} = this.props
        const {times} = this.state
        return (
            <View>
                <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                    <View style={styles.columnLeft}>
                        {this.displayTime(times.awakening, "bed", "Réveil")}
                        {this.displayTime(times.departure, "door-open", "Départ")}
                        {this.displayTime(times.duration, "subway", "Transport", 7)}
                        {this.displayTime(times.arrival, "university", "Arrivée", 7)}
                    </View>
                    <View style={{borderRightColor: colors.mainDark,
                    borderRightWidth: 1, margin: 5}}/>
                    <View style={styles.columnRight}>
                        {(weather.length > 1) ?
                        <View>
                            {this.displayWeather(0, 8)}
                            {this.displayWeather(1, 10)}
                            {this.displayWeather(2, 12)}
                            {this.displayWeather(3, 14)}
                            {this.displayWeather(4, 16)}
                            {this.displayWeather(5, 18)}
                        </View>
                        :
                        <View style={{flex: 1, justifyContent: "center", alignContent: "center"}}>
                            <ActivityIndicator size="large" color={colors.mainDark} />
                        </View>
                        }
                        
                    </View>
                </View>
                <TouchableOpacity style={styles.alarm}
                    onPress={() => {
                        const dep = this.props.createDepartureAlarm
                        RNAlarm.createAlarm('Morning Route ' + ((!dep) ? (times.departure.getHours() + ':' + times.departure.getMinutes()) : ": Reveil"), times.awakening.getHours(), times.awakening.getMinutes())
                        if (dep)
                            RNAlarm.createAlarm('Morning Route : Départ', times.departure.getHours(), times.departure.getMinutes())
                    }}
                    >
                        <Icons name="alarm-plus" size={50} color={colors.mainDark} />
                </TouchableOpacity>
            </View>
        )
    }

    displayJourneys = () => {
        const {journeys} = this.props
        const out = journeys.map((journey, id) => {
            const display = this.props.city.displayOneJourney(journey)
            return (
                <View key={id} style={{marginBottom: 0, marginTop: 10}}>
                    <View style={[styles.row, {justifyContent: "space-around"}]}>
                        <Text style={styles.previewTimesText}>{this.dateToTimeString(display.start)}</Text>
                        <Icon name="angle-double-right" size={30} color={colors.mainDark} />
                        <Text style={styles.previewTimesText}>{this.dateToTimeString(display.end)}</Text>
                    </View>
                    <View style={{marginBottom: 120, marginTop: 10}}>
                        <ScrollView key={id} contentContainerStyle={styles.slide}>
                            {display.content}
                        </ScrollView>
                    </View>
                    
                    
                </View>  
            )
        })
        return out
    }

    selectJourney = (id) => {
        console.log("SELECT JOURNEY " + id)
        const {prepareTime} = this.props
        const journey = this.props.journeys[id]
        const times = this.props.city.getTimesOfJourney(journey)       
        times.awakening = new Date(times.departure);
        times.awakening.setHours(times.awakening.getHours() - prepareTime.h)
        times.awakening.setMinutes(times.awakening.getMinutes() - prepareTime.m)
        this.setState({journeySelected: journey, times: times})
    }

    render() {
        const {weather, journeys, iGotLucky} = this.props
        const {journeySelected} = this.state
        
        return (
            <Modal
            style={styles.modal}
            isVisible={this.props.isVisible}
            >
            <View style={{flexDirection: "row", justifyContent: "space-around"}}>
                {journeySelected &&
                <TouchableOpacity style={{alignSelf: "flex-start"}} onPress={() =>this.setState({journeySelected: null})}>
                    <Icon name="backspace" size={30} color={colors.cancel} />
                </TouchableOpacity>
                }
                
                <TouchableOpacity style={{alignSelf: "center"}} onPress={() =>this.props.onQuit()}>
                    <Icons name="close-circle" size={30} color={colors.cancel} />
                </TouchableOpacity>
            </View>
                {(journeySelected) ?
                    this.displayResult()
                    :
                    <>
                    <Swiper style={styles.wrapper} showsButtons={true}
                        dotColor={colors.mainLighter}
                        activeDotColor={colors.mainDark}
                        nextButton={<Text style={styles.controlSwipeButton}>›</Text>}
                        prevButton={<Text style={styles.controlSwipeButton}>‹</Text>}
                        onIndexChanged={(id) => this.tmpIndex = id}
                    >
                        {this.displayJourneys()}                                
                    </Swiper>
                    <Icons 
                       onPress={() => this.selectJourney(this.tmpIndex)}
                       style={{position: "absolute", right: 30, bottom: 30}} name="check-circle" size={40} color={colors.mainDark}/>
                    </>
                }
            </Modal>
        )
    }
}



const styles = StyleSheet.create({
    inputRow: {
        marginTop: 20,
      justifyContent: 'center',
      alignItems:'center',
    },
    slide: {
        justifyContent: "center",
        alignItems: "center",
    },
    stopRow: {
        flexDirection: "row"
    }, 
    controlSwipeButton: {
        fontSize: 50,
        color: colors.mainDark
    },
    iconText: {
        width: 45,
    },
    previewTimesText : {
        fontSize: 20,
        color: colors.mainDark,
        fontStyle: "italic",
        alignSelf: "center",
        borderRadius: 10,
        padding: 5,
        backgroundColor: colors.mainLighter,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    text: {
      color: colors.mainDark,
      fontSize: 20,
      alignSelf: 'flex-start',
      fontStyle: "italic",
    },
    textTime: {
        color: colors.secondaryDark,
        fontSize: 30,
        marginLeft: 5,
      },
    textWeather: {
        color: colors.secondaryDark,
        fontSize: 25,
        marginLeft: 5,
        width: 80,
    },
    weatherTime: {
        color: colors.mainDark,
        alignSelf: "flex-start",
        fontSize: 16,
        width: 30,
    },
    alarm: {
        backgroundColor: colors.mainLighter,
        borderRadius: 40,
        padding: 10,
        marginTop: 20,
        alignSelf: "center",
        elevation: 10,
    },
    columnLeft: {
        justifyContent: "center",
        alignItems: "flex-start",
        flex: 1,
    },
    columnRight: {
        justifyContent: "center",
        alignItems: "flex-end",
        flex: 1,
    },
    modal: {
      margin: 10,
      backgroundColor: "white",
      borderRadius: 40,
      padding: 20,
    }
  });

export default ModalResult