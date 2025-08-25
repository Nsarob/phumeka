import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, FlatList, Image, Alert, SafeAreaView, RefreshControl, ScrollView } from "react-native";
import CustomLoading from "../../component/CustomLoading";
import { fetchUserSubmissions } from "../../services/submissionService";

const Submissions = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // Replace this with your actual professional ID management
    const professionalId = "your-professional-id";

    const fetchSubmissions = async () => {
        if (!professionalId) return;

        try {
            setLoading(true);
            const submissionsData = await fetchUserSubmissions(professionalId);
            
            setSubmissions(submissionsData.sort((a, b) => {
                const dateA = new Date(a.record_date);
                const dateB = new Date(b.record_date);
                return dateB.getTime() - dateA.getTime();
            }));
        } catch (error) {
            console.error("Error fetching submissions:", error);
            Alert.alert("Error", "Failed to load submissions.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [professionalId]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSubmissions();
    };

    const renderSubmission = ({ item }) => (
        <View style={styles.card}>
            <Text>Cry Type: {item.cry_type}</Text>
            <Text>Duration: {item.duration} seconds</Text>
            <Text>Date: {new Date(item.record_date).toLocaleDateString()}</Text>
            <Text>Time: {item.record_time}</Text>
            <Text>Device: {item.recording_device}</Text>
            <Text>Expert Annotation: {item.expert_annotation ? "Yes" : "No"}</Text>
            <Text>Baby ID: {item.id_baby}</Text>
        </View>
    );

    if (loading) {
        return <CustomLoading />;
    }

    console.log("submissions>>>", submissions)

    if (submissions.length === 0) {
        return (
            <SafeAreaView style={styles.emptyContainer}>
                <ScrollView
                    style={styles.scrollViewSt}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor='#45B3CB'
                        />
                    }
                >
                    <View style={styles.emptyContainerView}>
                        <Image
                            source={require('../../../assets/no_submission.png')}
                            style={styles.emptyImage}
                        />
                        <Text style={styles.emptyText}>
                            No submissions found! Please make a submission.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <Text style={styles.header}>Submissions</Text>
            <FlatList
                data={submissions}
                keyExtractor={(item) => item.id}
                renderItem={renderSubmission}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor='#45B3CB' // Optional: Customize spinner color
                    />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    loadingText: {
        fontSize: 18,
        color: "#666",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        height: '100%'
    },
    emptyContainerView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        marginTop: 150
    },
    scrollViewSt: {
        flex: 1,
        alignSelf: 'center',
        height: '100%'
    },
    emptyImage: {
        width: 150,
        height: 150,
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 16,
        color: "#555",
        textAlign: "center",
    },
    listContainer: {
        padding: 16,
        backgroundColor: "#fff",
    },
    card: {
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        padding: 16,
        marginVertical: 8,
        elevation: 2, // For Android shadow
        shadowColor: "#000", // For iOS shadow
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
    },
    header: {
        fontSize: 24,
        fontWeight: '600',
        color: '#45B3CB',
        marginBottom: 20,
        marginTop: 20,
        textAlign: 'center',
    },
});

export default Submissions;
