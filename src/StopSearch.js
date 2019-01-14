import React, {Component} from 'react';
import {StyleSheet, Text, View, TouchableOpacity, AsyncStorage, ActivityIndicator, Keyboard, PermissionsAndroid} from 'react-native';
import Autocomplete from 'react-native-autocomplete-input'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from 'react-native-geolocation-service';

import colors from './color.js'


class StopSearch extends Component {
    constructor(props) {
        super(props);
        this.state = {
            search : "",
            searchItem : null,
            autofill: [], 
            timeout: null,
            coord: null,
        }
        this.getSavedSearch()
        this.timeout = null;
        this.searchUrl = "https://www.tisseo.fr/proxy/api/tisseo/v1/places.json?displayBestPlace=1&lang=fr&simple=1&term="
    }

    getSavedSearch = async () => {
        try {
            let value = await AsyncStorage.getItem(this.props.keySave);
            if (value !== null) {
                value = JSON.parse(value)
                if (value.fromGPS) {
                    this.getCurrentPosition(() => {
                        this.setState({searchItem: this.state.coord, search:  "Votre Position"}, () => this.saveSearch())
                    })
                } else {
                    this.props.onChange(value)
                    this.setState({searchItem: value, search:  value.label})
                }
                
            }
        } catch (error) {
            console.log(error)
        }
    }

    saveSearch = async () => {
        try {
            this.props.onChange(this.state.searchItem)
            await AsyncStorage.setItem(this.props.keySave, JSON.stringify(this.state.searchItem));
        } catch (error) {
            console.log(error)
        }
    }

    searchAutocomplete = () => {
        fetch(this.searchUrl + this.state.search).then(rep => rep.json())
        .then(rep => {
            let cat = ""
            rep = rep.splice(0, 8)
            rep.forEach((e, id) => {
                if (cat !== e.category) {
                    cat = e.category
                    rep.splice(id, 0, {category: cat, banner: true})
                }
            });
            this.setState({autofill : rep, timeout: null})
        })
    }

    getCurrentPosition = (func) => {
        if (this.getGPSperm) {
          Geolocation.getCurrentPosition(
            (position) => {
                position.coords.fromGPS = true
                this.setState({coord: position.coords}, () => {
                if (func)
                    func()
            })},
            (error) => console.log(error.code, error.message),
            {enableHighAccuracy: true, timeout: 5000}
          );
        } else
          this.requestCameraPermission(func)
    }

    requestCameraPermission = async (func) => {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {'title': 'Morning Route GPS permission',
              'message': 'Morning Route à besoin d\'acceder a votre GPS pour vous localiser.'}
          )
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            this.getCurrentPosition(func)
            this.getGPSperm = true} 
          else {this.getGPSperm = false}
        } catch (err) {console.warn(err)}
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            {'title': 'Morning Route GPS permission',
              'message': 'Morning Route à besoin d\'acceder a votre GPS pour vous localiser.'}
          )
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {this.getGPSperm = true} 
          else {this.getGPSperm = false}
        } catch (err) {console.warn(err)}
    }

    render() {
        const {search} = this.state
        return (
            <View style={[this.props.style, {flexDirection: "row", alignItems: "stretch"}]}>
                <View style={styles.autocompleteContainer}>
                    <Autocomplete
                        data={this.state.autofill}
                        defaultValue={search}
                        placeholder={this.props.placeholder}
                        onChangeText={text => {
                            this.props.onStartChanging()
                            this.setState({ search: text , searchItem: null})
                            if (this.state.timeout)
                                clearTimeout(this.state.timeout)
                            this.setState({timeout: setTimeout(() => this.searchAutocomplete(), 1000)})
                    }}
                        renderItem={item => 
                            {if (item.banner)
                                return (<Text  key={item.id} style={styles.banner}>{item.category}</Text>)
                            else
                                return (
                                <TouchableOpacity key={item.id} onPress={() => {
                                    item.fromGPS = false
                                    this.setState({ search: item.label, searchItem: item, autofill: []}, () => {
                                    Keyboard.dismiss()
                                    this.props.onEndChanging()
                                    this.saveSearch()
                                })}}>
                                    <Text style={styles.autofill}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        
                        }
                    />
                </View>
                {(this.props.allowGPS) && 
                <Icon name="crosshairs-gps" style={styles.gps} size={30} color={colors.mainDark} 
                onPress={() => {
                    this.getCurrentPosition(() => {
                        this.setState({search: "Votre position", searchItem: this.state.coord, autofill: []},
                        () => {
                            this.props.onEndChanging()
                            this.saveSearch()
                        })
                    })
                    Keyboard.dismiss()
                }}/>}
                {(this.state.searchItem !== null) ?
                <Icon name="check-circle"  style={styles.icon} size={30} color={colors.secondaryLight} />
                :
                <>
                
                
                {(this.state.timeout) ?
                <ActivityIndicator style={styles.icon} size="large" color={colors.mainDark} />
                    :
                <Icon name="close-circle"  style={styles.icon} size={30} color={colors.cancel} />
                }
                </>
                }
                
            </View>
        )
    }
}


const styles = StyleSheet.create({
    autocompleteContainer: {
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 1
    },
    banner: {
        backgroundColor : colors.mainLighter,
        fontSize: 20,
    },
    autofill: {
        fontSize: 20,
    },
    icon: {
        position: "absolute",
        right: 5,
        top: 5,
    },
    gps: {
        position: "absolute",
        right: 40,
        top: 5,
    },
  });

export default StopSearch;