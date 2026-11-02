import 'package:flutter/material.dart';

void main() {
  runApp(const GuardApp());
}

class GuardApp extends StatelessWidget {
  const GuardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MyCommunity Gate Terminal',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF06B6D4),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF090D16),
      ),
      home: const GuardHomeScreen(),
    );
  }
}

class GuardHomeScreen extends StatefulWidget {
  const GuardHomeScreen({super.key});

  @override
  State<GuardHomeScreen> createState() => _GuardHomeScreenState();
}

class _GuardHomeScreenState extends State<GuardHomeScreen> {
  final List<Map<String, dynamic>> _liveQueue = [
    {
      'id': 'v-001',
      'name': 'Deepak Verma',
      'phone': '9845011223',
      'unit': 'Tower A - 101',
      'purpose': 'Guest',
      'status': 'PENDING',
      'code': '4192',
    },
    {
      'id': 'v-002',
      'name': 'Sunil Kumar (Swiggy)',
      'phone': '9812345678',
      'unit': 'Tower A - 101',
      'purpose': 'Delivery',
      'vehicle': 'KA 05 EZ 8821',
      'status': 'APPROVED',
      'code': '8310',
    },
    {
      'id': 'v-003',
      'name': 'Manoj Sharma (Urban AC)',
      'phone': '9740112233',
      'unit': 'Tower A - 201',
      'purpose': 'Home Service',
      'vehicle': 'KA 01 HG 3490',
      'status': 'CHECKED_IN',
      'code': '1092',
    },
  ];

  void _checkIn(int index) {
    setState(() {
      _liveQueue[index]['status'] = 'CHECKED_IN';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🟢 Checked In: ${_liveQueue[index]['name']} entered society'),
        backgroundColor: const Color(0xFF06B6D4),
      ),
    );
  }

  void _checkOut(int index) {
    final name = _liveQueue[index]['name'];
    setState(() {
      _liveQueue.removeAt(index);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('⚪ Checked Out: $name departed gate'),
        backgroundColor: Colors.blueGrey,
      ),
    );
  }

  void _showNewVisitorDialog() {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();
    String selectedUnit = 'Tower A - 101';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0F172A),
        title: const Text('Register Arriving Visitor at Gate'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Visitor Full Name'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Phone Number'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: selectedUnit,
                items: const [
                  DropdownMenuItem(value: 'Tower A - 101', child: Text('Tower A - 101 (Ananya)')),
                  DropdownMenuItem(value: 'Tower A - 201', child: Text('Tower A - 201 (Suresh)')),
                ],
                onChanged: (val) {
                  if (val != null) selectedUnit = val;
                },
                decoration: const InputDecoration(labelText: 'Destination Flat'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (nameController.text.isNotEmpty && phoneController.text.isNotEmpty) {
                setState(() {
                  _liveQueue.insert(0, {
                    'id': 'v-${DateTime.now().millisecondsSinceEpoch}',
                    'name': nameController.text,
                    'phone': phoneController.text,
                    'unit': selectedUnit,
                    'purpose': 'Guest',
                    'status': 'PENDING',
                    'code': '9942',
                  });
                });
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('🔔 Notification sent to flat resident. Waiting for approval.'),
                    backgroundColor: Color(0xFF6366F1),
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF06B6D4)),
            child: const Text('Register & Notify'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.security, color: Color(0xFF06B6D4)),
            SizedBox(width: 8),
            Text('Gate Terminal (Main Gate 1)', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        backgroundColor: const Color(0xFF0F172A),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('QR Scanner ready for guest pass verification')),
              );
            },
            tooltip: 'Scan Guest Pass',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showNewVisitorDialog,
        backgroundColor: const Color(0xFF06B6D4),
        icon: const Icon(Icons.person_add, color: Colors.white),
        label: const Text('New Visitor', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _liveQueue.length,
        itemBuilder: (context, index) {
          final item = _liveQueue[index];
          final status = item['status'];

          return Card(
            color: const Color(0xFF1E293B),
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item['name'],
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Destination: ${item['unit']} • ${item['purpose']}',
                          style: const TextStyle(color: Color(0xFFA5B4FC), fontSize: 13),
                        ),
                        Text(
                          '📞 ${item['phone']} • Pass Code: ${item['code']}',
                          style: const TextStyle(color: Colors.grey, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Chip(
                        label: Text(
                          status,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                        backgroundColor: status == 'APPROVED'
                            ? Colors.green.withOpacity(0.2)
                            : (status == 'CHECKED_IN'
                                ? Colors.cyan.withOpacity(0.2)
                                : Colors.amber.withOpacity(0.2)),
                      ),
                      const SizedBox(height: 6),
                      if (status == 'APPROVED')
                        ElevatedButton.icon(
                          onPressed: () => _checkIn(index),
                          icon: const Icon(Icons.login, size: 16),
                          label: const Text('Check In'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.white,
                          ),
                        )
                      else if (status == 'CHECKED_IN')
                        OutlinedButton.icon(
                          onPressed: () => _checkOut(index),
                          icon: const Icon(Icons.logout, size: 16),
                          label: const Text('Check Out'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.blueGrey[200],
                            side: BorderSide(color: Colors.blueGrey[400]!),
                          ),
                        )
                      else
                        const Text(
                          'Waiting approval',
                          style: TextStyle(color: Colors.amber, fontSize: 11),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
