import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://rsms.me/inter/font-files/Inter-Regular.woff', fontWeight: 400 },
    { src: 'https://rsms.me/inter/font-files/Inter-SemiBold.woff', fontWeight: 600 },
    { src: 'https://rsms.me/inter/font-files/Inter-Bold.woff', fontWeight: 700 },
    { src: 'https://rsms.me/inter/font-files/Inter-Black.woff', fontWeight: 900 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    backgroundColor: '#0A0F1E',
    color: '#E2E8F0',
    padding: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 15,
  },
  logo: {
    fontSize: 24,
    fontWeight: 900,
    color: '#F59E0B',
  },
  headerText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'right',
  },
  title: {
    fontSize: 28,
    fontWeight: 900,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#F59E0B',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 6,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
    width: '32%',
  },
  gridLabel: {
    fontSize: 9,
    color: '#94A3B8',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#FFFFFF',
  },
  subjectRow: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#FFFFFF',
  },
  subjectMeta: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  masteryBarContainer: {
    width: 120,
    height: 10,
    backgroundColor: '#334155',
    borderRadius: 5,
    marginTop: 4,
  },
  masteryBar: {
    height: 10,
    borderRadius: 5,
  },
  masteryScore: {
    width: 60,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 700,
  },
  bandLabel: {
    fontSize: 9,
    fontWeight: 600,
    textAlign: 'right',
  },
  narrative: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#CBD5E1',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#475569',
  },
});

const getMasteryStyle = (score: number) => {
  if (score >= 85) return { color: '#3B82F6', label: 'Mastered' };
  if (score >= 70) return { color: '#10B981', label: 'Strong' };
  if (score >= 50) return { color: '#F59E0B', label: 'Secure' };
  return { color: '#EF4444', label: 'Developing' };
};

interface ReportData {
  childName: string;
  period: string;
  generatedDate: string;
  totalSessions: number;
  totalTime: string;
  lessonsCompleted: number;
  subjects: Array<{
    name: string;
    sessions: number;
    time: string;
    mastery: number;
    narrative: string;
  }>;
}

const LAReportPDF: React.FC<{ data: ReportData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.logo}>Luminary</Text>
        <View>
          <Text style={styles.headerText}>Progress Report</Text>
          <Text style={styles.headerText}>Generated: {data.generatedDate}</Text>
        </View>
      </View>

      <Text style={styles.title}>{data.childName}</Text>
      <Text style={styles.subtitle}>{data.period} Learning Summary</Text>

      <View style={styles.section}>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Total Sessions</Text>
            <Text style={styles.gridValue}>{data.totalSessions}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Total Learning Time</Text>
            <Text style={styles.gridValue}>{data.totalTime}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Lessons Completed</Text>
            <Text style={styles.gridValue}>{data.lessonsCompleted}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subject Breakdown</Text>
        {data.subjects.map((subject, index) => {
          const masteryStyle = getMasteryStyle(subject.mastery);
          return (
            <View key={index} style={styles.subjectRow}>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text style={styles.subjectMeta}>
                  {subject.sessions} sessions &middot; {subject.time} learning time
                </Text>
                <View style={styles.masteryBarContainer}>
                  <View
                    style={[
                      styles.masteryBar,
                      { width: `${subject.mastery}%`, backgroundColor: masteryStyle.color },
                    ]}
                  />
                </View>
              </View>
              <View style={{ width: 60, alignItems: 'flex-end' }}>
                <Text style={[styles.masteryScore, { color: masteryStyle.color }]}>
                  {subject.mastery}%
                </Text>
                <Text style={[styles.bandLabel, { color: masteryStyle.color }]}>
                  {masteryStyle.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning Narrative</Text>
        {data.subjects.map((subject, index) => (
          <View key={index} style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: 600, color: '#FFFFFF', marginBottom: 4 }}>{subject.name}</Text>
            <Text style={styles.narrative}>{subject.narrative}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>
        This report was generated by Luminary, the AI learning companion. All data is based on the child’s interactions with the platform.
      </Text>
    </Page>
  </Document>
);

export default LAReportPDF;
