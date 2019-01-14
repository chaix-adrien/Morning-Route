import React, {Component} from 'react';
import {StyleSheet, Text, View, Picker, TouchableOpacity, AsyncStorage, Keyboard} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import colors from './color.js'


class TimePicker extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedHour: 0,
            selectedMin: 0,
            setting: false
        }
        this.getSavedTimes()
    }

    getPickerItem = (min, max, jump, label) => {
        return new Array((max - min) / jump).fill(0).map((v, i) => {
            let value = i * jump
            if (value <= 9)
                value = "0" + value
            return (<Picker.Item key={i} label={value + label} value={value + ""}/>)
        })
    }

    getSavedTimes = async () => {
        try {
            let value = await AsyncStorage.getItem(this.props.keySave);
            if (value !== null) {
                value = JSON.parse(value)
            this.setState({selectedHour: value[0], selectedMin: value[1]}, () => this.props.onChange(this.state.selectedHour, this.state.selectedMin))
            }
        } catch (error) {
            console.log(error)
        }
    }

    saveTimes = async () => {
        try {
            this.props.onChange(this.state.selectedHour, this.state.selectedMin)                        
            await AsyncStorage.setItem(this.props.keySave, JSON.stringify([this.state.selectedHour, this.state.selectedMin]));
        } catch (error) {
              console.log(error)
        }
    }

    formatTimeText = (forceHour) => {
        let out = "";
        const {selectedHour, selectedMin} = this.state
        if (selectedHour === null)
            out = "Paramétrer"
        else if (selectedHour == 0 && forceHour === false)
            out = selectedMin + "m"
        else
            out = selectedHour + "h " + selectedMin + "m"
        return out
    }
    

    render() {
        return (
            <View style={[this.props.style, {}]}>
                {(this.props.setting === "always" || this.state.setting) ? 
                <View style={{flexDirection: "row", alignItems: "center"}}>
                    <Picker
                    prompt="Heure"
                    mode="dropdown"
                    selectedValue={this.state.selectedHour}
                    onValueChange={(itemV) => {
                        this.setState({selectedHour: itemV}, () => this.saveTimes())
                    }}
                    style={styles.picker}
                    >
                        {this.getPickerItem(this.props.minH, this.props.maxH, 1, "h")}
                    </Picker>
                    <Picker
                    prompt="Minute"
                    mode="dropdown"
                    selectedValue={this.state.selectedMin}
                    onValueChange={(itemV) => {
                        this.setState({selectedMin: itemV}, () => this.saveTimes())
                    }}
                    style={[styles.picker, {right: 40}]}
                    >
                        {this.getPickerItem(this.props.minM, this.props.maxM, this.props.jumpMin, "")}
                    </Picker>
                    {this.props.setting !== "always" && <Icon name="check" size={30} color={colors.secondaryLight} onPress={() => {
                        this.props.onSetting(false)
                        this.setState({setting : !this.state.setting})}
                        }
                    />}
                </View>
            :
                <TouchableOpacity  style={styles.viewSelected} onPress={() => {
                    this.props.onSetting(true)
                    this.setState({setting : !this.state.setting})
                    }}>
                    <Text style={styles.text}>{this.formatTimeText(this.props.forceHour)}</Text>
                </TouchableOpacity >
            }
                
            </View>
        )
    }
}


  
const styles = StyleSheet.create({
    picker: {
        height: 50,
        width: 90,
    },
    text: {
        color: colors.mainDark,
        fontSize: 20,
        textAlign: 'left',
    },
    viewSelected: {
        flexDirection: 'row',
        backgroundColor: colors.mainLighter,
        padding: 10,
        borderRadius: 50,
        shadowColor: "#000",
        shadowOpacity: 0.36,
        shadowRadius: 6.68,
        elevation: 11,     
    }
  });

export default TimePicker;