import 'package:flutter/material.dart';

void main() {
  runApp(const ResidentApp());
}

class ResidentApp extends StatelessWidget {
  const ResidentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MyCommunity Resident',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6366F1),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF090D16),
      ),
      home: const ResidentHomeScreen(),
    );
  }
}

class ResidentHomeScreen extends StatefulWidget {
  const ResidentHomeScreen({super.key});

  @override
  State<ResidentHomeScreen> createState() => _ResidentHomeScreenState();
}

class _ResidentHomeScreenState extends State<ResidentHomeScreen> {
  // Sample visitor waiting at gate for this resident's flat
  final List<Map<String, dynamic>> _pendingVisitors = [
    {
      'id': 'v-001',
      'name': 'Deepak Verma',
      'purpose': 'Guest',
      'phone': '9845011223',
      'time': 'Just now',
      'status': 'PENDING',
    },
    {
      'id': 'v-002',
      'name': 'Sunil Kumar (Swiggy)',
      'purpose': 'Delivery',
      'phone': '9812345678',
      'vehicle': 'KA 05 EZ 8821',
      'time': '5 mins ago',
      'status': 'APPROVED',
    }
  ];

  void _approveVisitor(int index) {
    setState(() {
      _pendingVisitors[index]['status'] = 'APPROVED';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✅ Approved ${_pendingVisitors[index]['name']} for entry'),
        backgroundColor: const Color(0xFF10B981),
      ),
    );
  }

  void _rejectVisitor(int index) {
    setState(() {
      _pendingVisitors[index]['status'] = 'REJECTED';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('❌ Declined entry for ${_pendingVisitors[index]['name']}'),
        backgroundColor: const Color(0xFFF43F5E),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Tower A • Flat 101',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Text(
              'Palm Meadows Heights',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF0F172A),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_2),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Generate Guest Pass (Coming in Phase 6)')),
              );
            },
            tooltip: 'Create Guest Pass',
          ),
          IconButton(
            icon: const Icon(Icons.notifications_active_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Quick SOS Button
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF7F1D1D), Color(0xFF991B1B)],
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.emergency, color: Colors.white, size: 28),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Emergency SOS',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        Text(
                          'Direct alert to Main Gate Security',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('🚨 SOS Alert simulated to Main Gate Guard'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.red[900],
                    ),
                    child: const Text('SOS'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            const Text(
              'Gate Activity & Visitors',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            Expanded(
              child: ListView.builder(
                itemCount: _pendingVisitors.length,
                itemBuilder: (context, index) {
                  final visitor = _pendingVisitors[index];
                  final isPending = visitor['status'] == 'PENDING';
                  final isApproved = visitor['status'] == 'APPROVED';

                  return Card(
                    color: const Color(0xFF1E293B),
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: isPending
                            ? const Color(0xFFF59E0B)
                            : Colors.transparent,
                        width: 1,
                      ),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                visitor['name'],
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Chip(
                                label: Text(
                                  visitor['status'],
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                backgroundColor: isPending
                                    ? Colors.amber.withOpacity(0.2)
                                    : (isApproved
                                        ? Colors.green.withOpacity(0.2)
                                        : Colors.red.withOpacity(0.2)),
                              ),
                            ],
                          ),
                          Text(
                            'Purpose: ${visitor['purpose']} • ${visitor['time']}',
                            style: const TextStyle(color: Colors.grey, fontSize: 13),
                          ),
                          if (visitor['vehicle'] != null)
                            Text(
                              'Vehicle: ${visitor['vehicle']}',
                              style: const TextStyle(
                                color: Color(0xFF38BDF8),
                                fontSize: 13,
                              ),
                            ),
                          const SizedBox(height: 12),

                          if (isPending)
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: () => _rejectVisitor(index),
                                    icon: const Icon(Icons.close, color: Colors.red),
                                    label: const Text('Decline'),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: Colors.red,
                                      side: const BorderSide(color: Colors.red),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () => _approveVisitor(index),
                                    icon: const Icon(Icons.check, color: Colors.white),
                                    label: const Text('Approve Entry'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF10B981),
                                      foregroundColor: Colors.white,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
