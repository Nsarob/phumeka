import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const faqs = [
    {
        question: "What is HumekaFL?",
        answer: "HumekaFL is a tool that predicts wether or not the baby has asphyxia using their cries"
    },
    {
        question: "What kinds of cries does HumekaFL predict?",
        answer: "It predicts positive or negative."
    },
    {
        question: "How accurate is HumekaFL?",
        answer: "It is highly accurate but not a substitute for medical advice."
    },
    {
        question: "Is this a medical device?",
        answer: "No. See also above."
    },
    {
        question: "Who do I contact for more information?",
        answer: "You can contact our support team via email or phone."
    }
];

const FAQItem = ({ question, answer, isOpen, onToggle }) => {
    return (
        <TouchableOpacity
            style={styles.faqItem}
            onPress={onToggle}
            activeOpacity={0.7}
        >
            <View style={styles.questionRow}>
                <Text style={styles.questionText}>{question}</Text>
                <MaterialIcons
                    name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                    size={24}
                    color="#45B3CB"
                />
            </View>
            {isOpen && (
                <Text style={styles.answerText}>{answer}</Text>
            )}
        </TouchableOpacity>
    );
};

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);

    const handleToggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                <Text style={styles.header}>Frequently Asked Questions</Text>
                {faqs.map((faq, index) => (
                    <FAQItem
                        key={index}
                        question={faq.question}
                        answer={faq.answer}
                        isOpen={openIndex === index}
                        onToggle={() => handleToggle(index)}
                    />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10,
    },
    header: {
        fontSize: 24,
        fontWeight: '600',
        color: '#45B3CB',
        marginBottom: 20,
        marginTop: 40,
        textAlign: 'center',
    },
    faqItem: {
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    questionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    questionText: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
        marginRight: 8,
    },
    answerText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    }
});