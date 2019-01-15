import React, {Component} from 'react';
import {StyleSheet, Text, View,TouchableOpacity, CheckBox, AsyncStorage, ScrollView} from 'react-native';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import Modal from "react-native-modal";
import colors from './color.js'
import settingsTemplate from "./settings.js"

class ModalSetting extends Component {
    constructor(props) {
        super(props)
        this.state = settingsTemplate
        this.loadSettings()
    }

    save = async () => {
        try {
            await AsyncStorage.setItem("@MorningRoute:Settings", JSON.stringify(this.state))
        } catch (error) {
            console.log(error)
        }
    }

    loadSettings = async () => {
        try {
            let value = await AsyncStorage.getItem("@MorningRoute:Settings")
            if (value !== null) {
                value = JSON.parse(value)
                this.setState(value)
            }
        } catch (error) {
            this.save()
            console.log(error)
        }    
    }

    render() {
        return (
            <Modal
            style={styles.modal}
            isVisible={this.props.isVisible}
            >
                <View style={{flexDirection: "row", justifyContent: "space-around"}}>
                    <TouchableOpacity style={{alignSelf: "center"}} onPress={() =>this.props.onQuit()}>
                        <Icons name="close-circle" size={30} color={colors.cancel} />
                    </TouchableOpacity>
                </View>
                <ScrollView style={{marginTop: 20}}>
                    <View style={styles.row}>
                        <Text style={styles.text}>J'ai de la chance</Text>
                        <CheckBox
                        value={this.state.iGotLucky}
                        onChange={() => this.setState({iGotLucky: !this.state.iGotLucky}, () => this.save())}
                        />
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.text}>Alarme de départ</Text>
                        <CheckBox
                        value={this.state.createDepartureAlarm}
                        onChange={() => this.setState({createDepartureAlarm: !this.state.createDepartureAlarm}, () => this.save())}
                        />
                    </View>
                    
                </ScrollView>
            </Modal>
        )
    }
}

const styles = StyleSheet.create({
    modal: {
        margin: 40,
        backgroundColor: "white",
        borderRadius: 40,
        padding: 20,
        marginBottom: 300,
        justifyContent: 'space-between'
      },
      row: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 20,
      },
      text: {
          fontSize: 20,
          fontStyle: "italic",
      }
})

export default ModalSetting