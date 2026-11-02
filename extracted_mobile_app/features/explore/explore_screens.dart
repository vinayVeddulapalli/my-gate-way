import 'dart:async';
import 'dart:convert';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../services/content_repository.dart';
import '../../ui/theme.dart';
import '../../ui/widgets.dart';

String money(dynamic price) => price == 0
    ? 'FREE'
    : '₹ ${NumberFormat.decimalPattern('en_IN').format(price ?? 0)}';
const categories = [
  'Furniture',
  'Food',
  'Services',
  'Home Decor',
  'Electronics',
  'Vehicles',
  'Kids Items',
  'Others',
  'Free',
];
const categoryIcons = [
  Icons.chair_outlined,
  Icons.cake_outlined,
  Icons.handyman_outlined,
  Icons.light_outlined,
  Icons.local_laundry_service_outlined,
  Icons.directions_car_outlined,
  Icons.toys_outlined,
  Icons.menu_book_outlined,
  Icons.volunteer_activism_outlined,
];
const serviceCategories = [
  'Cleaning',
  'Appliance Repair',
  'Moving',
  'Painting',
];

class ItemPhoto extends StatelessWidget {
  const ItemPhoto(this.item, {super.key, this.height = 170});
  final Map<String, dynamic> item;
  final double height;
  @override
  Widget build(BuildContext context) {
    if (item['photo_base64'] != null) {
      return Image.memory(
        base64Decode(item['photo_base64']),
        height: height,
        width: double.infinity,
        fit: BoxFit.cover,
      );
    }
    if (item['photo_url'] != null) {
      return Image.network(
        item['photo_url'],
        height: height,
        width: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (_, e, s) =>
            const Center(child: Icon(Icons.broken_image_outlined)),
      );
    }
    final asset = item['image_asset'] ?? 'community';
    final file = asset == 'house' || asset == 'community'
        ? 'community.jpg'
        : '$asset.jpg';
    return Image.asset(
      'assets/images/$file',
      height: height,
      width: double.infinity,
      fit: BoxFit.cover,
      errorBuilder: (_, e, s) => Container(
        height: height,
        color: const Color(0xFFDDE8E3),
        alignment: Alignment.center,
        child: Icon(
          asset == 'chair'
              ? Icons.chair_outlined
              : asset == 'moving'
              ? Icons.local_shipping_outlined
              : Icons.home_work_outlined,
          size: 64,
          color: AppColors.coral,
        ),
      ),
    );
  }
}

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key, required this.kind});
  final String kind;
  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  List<Map<String, dynamic>> items = [];
  String query = '', category = '';
  String? cursor, error;
  bool loading = true, saved = false, mine = false;
  int generation = 0;
  Timer? debounce;
  String get title => widget.kind == 'property'
      ? 'Homes'
      : widget.kind == 'service'
      ? 'Services'
      : widget.kind == 'notice'
      ? 'Notice Board'
      : 'Buy & Sell';
  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  void didUpdateWidget(ExploreScreen old) {
    super.didUpdateWidget(old);
    if (old.kind != widget.kind) {
      query = '';
      category = '';
      saved = false;
      mine = false;
      load();
    }
  }

  @override
  void dispose() {
    debounce?.cancel();
    super.dispose();
  }

  Future<void> load({bool more = false}) async {
    final version = ++generation;
    setState(() => loading = true);
    try {
      final data = await ref
          .read(contentRepositoryProvider)
          .list(
            widget.kind,
            search: query,
            category: category,
            saved: saved,
            mine: mine,
            cursor: more ? cursor : null,
          );
      if (!mounted || version != generation) return;
      setState(() {
        final next = (data['items'] as List)
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        items = more ? [...items, ...next] : next;
        cursor = data['next_cursor'];
        error = null;
        loading = false;
      });
    } catch (e) {
      if (mounted && version == generation) {
        setState(() {
          error = friendlyError(e);
          loading = false;
        });
      }
    }
  }

  Future<void> newItem() async {
    await context.push('/new-item/${widget.kind}');
    if (mounted) load();
  }

  @override
  Widget build(BuildContext context) => Stack(
    children: [
      RefreshIndicator(
        onRefresh: load,
        child: AppPage(
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 25,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                IconButton(
                  tooltip: mine ? 'Show all listings' : 'My listings',
                  onPressed: () {
                    setState(() => mine = !mine);
                    load();
                  },
                  icon: Icon(mine ? Icons.sell : Icons.sell_outlined),
                ),
                IconButton(
                  tooltip: saved ? 'Show all items' : 'Saved items',
                  onPressed: () {
                    setState(() => saved = !saved);
                    load();
                  },
                  icon: Icon(saved ? Icons.bookmark : Icons.bookmark_border),
                ),
                IconButton(
                  tooltip: 'Enquiries and requests',
                  onPressed: () => context.push('/activity'),
                  icon: const Icon(Icons.chat_bubble_outline),
                ),
              ],
            ),
            const SizedBox(height: 18),
            if (widget.kind == 'property' && !saved && !mine) ...[
              _propertyBanner(),
              const SizedBox(height: 20),
            ],
            if (widget.kind == 'service' && !saved && !mine) ...[
              _servicesBanner(),
              const SizedBox(height: 24),
            ],
            if (widget.kind == 'listing' && !saved && !mine) ...[
              InkWell(
                onTap: () => context.go('/homes'),
                child: Surface(
                  radius: 22,
                  child: Column(
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.home_work_outlined, size: 29),
                          const SizedBox(width: 14),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Homes',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                Text(
                                  'List · Buy · Rent',
                                  style: TextStyle(color: AppColors.muted),
                                ),
                              ],
                            ),
                          ),
                          const Text(
                            'Explore',
                            style: TextStyle(
                              color: AppColors.coral,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const Icon(Icons.chevron_right),
                        ],
                      ),
                      const SizedBox(height: 14),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(15),
                        child: const ItemPhoto({
                          'image_asset': 'house',
                        }, height: 105),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
            if (saved || mine)
              Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Text(
                  saved ? 'Your saved items' : 'Your listings and drafts',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            if (widget.kind == 'property')
              Surface(
                child: Column(
                  children: [
                    Row(
                      children: [
                        for (final entry in ['Rent', 'Buy'])
                          Expanded(
                            child: TextButton(
                              onPressed: () {
                                setState(
                                  () =>
                                      category = category == entry ? '' : entry,
                                );
                                load();
                              },
                              child: Column(
                                children: [
                                  Text(
                                    entry,
                                    style: TextStyle(
                                      fontSize: 17,
                                      fontWeight: category == entry
                                          ? FontWeight.w800
                                          : FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Container(
                                    height: 3,
                                    color: category == entry
                                        ? AppColors.yellow
                                        : Colors.transparent,
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Find your next home in your community',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 15),
                    _search(),
                  ],
                ),
              )
            else
              _search(),
            const SizedBox(height: 22),
            if (widget.kind == 'listing')
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: categories.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  mainAxisExtent: 100,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 8,
                ),
                itemBuilder: (context, i) => InkWell(
                  onTap: () {
                    setState(
                      () => category = category == categories[i]
                          ? ''
                          : categories[i],
                    );
                    load();
                  },
                  child: Column(
                    children: [
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: category == categories[i]
                              ? AppColors.yellow
                              : Colors.white,
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Icon(categoryIcons[i], size: 29),
                      ),
                      const SizedBox(height: 7),
                      Text(
                        categories[i],
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 11),
                      ),
                    ],
                  ),
                ),
              ),
            if (widget.kind == 'service')
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    for (final name in serviceCategories)
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(name),
                          selected: category == name,
                          onSelected: (_) {
                            setState(
                              () => category = category == name ? '' : name,
                            );
                            load();
                          },
                        ),
                      ),
                  ],
                ),
              ),
            const SizedBox(height: 20),
            SectionTitle(
              category.isNotEmpty
                  ? category
                  : widget.kind == 'property'
                  ? 'From your society'
                  : widget.kind == 'service'
                  ? 'Services for your home'
                  : 'Recent listings',
              count: items.length,
            ),
            const SizedBox(height: 16),
            if (error != null)
              Surface(
                child: EmptyState(
                  title: 'Couldn’t load this page',
                  message: error!,
                  action: TextButton(
                    onPressed: load,
                    child: const Text('Try again'),
                  ),
                ),
              )
            else if (loading && items.isEmpty)
              const Padding(
                padding: EdgeInsets.all(35),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (items.isEmpty)
              const Surface(
                child: EmptyState(
                  title: 'A fresh start',
                  message:
                      'No items match these filters. Try another search or add a listing.',
                ),
              )
            else
              LayoutBuilder(
                builder: (context, c) => GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: items.length,
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: c.maxWidth > 800
                        ? 4
                        : c.maxWidth > 560
                        ? 3
                        : 2,
                    mainAxisExtent: c.maxWidth < 400 ? 242 : 278,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 16,
                  ),
                  itemBuilder: (context, i) =>
                      _item(items[i], c.maxWidth < 400 ? 150 : 182),
                ),
              ),
            if (cursor != null)
              Center(
                child: TextButton(
                  onPressed: loading ? null : () => load(more: true),
                  child: const Text('Load more'),
                ),
              ),
            if (widget.kind == 'service') ...[
              const SizedBox(height: 28),
              const Surface(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'A little help, close to home.',
                      style: TextStyle(
                        fontSize: 21,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(height: 12),
                    Text(
                      'Choose a service and a date. Your society team will review the request and confirm availability. Payment is arranged directly with the provider.',
                      style: TextStyle(height: 1.7, color: AppColors.muted),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 95),
          ],
        ),
      ),
      if (widget.kind == 'property' || widget.kind == 'listing')
        Positioned(
          right: 20,
          bottom: 22,
          child: FloatingActionButton.extended(
            backgroundColor: AppColors.yellow,
            foregroundColor: AppColors.ink,
            onPressed: newItem,
            icon: const Icon(Icons.add, size: 27),
            label: Text(
              widget.kind == 'property' ? 'Post Property' : 'New Listing',
              style: const TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ),
    ],
  );
  Widget _search() => TextField(
    onChanged: (v) {
      query = v;
      debounce?.cancel();
      debounce = Timer(const Duration(milliseconds: 300), load);
    },
    decoration: InputDecoration(
      hintText: widget.kind == 'property'
          ? 'Search by home, features or description'
          : 'What are you looking for?',
      prefixIcon: const Icon(Icons.search),
      fillColor: const Color(0xFFF9FAFB),
    ),
  );
  Widget _item(Map<String, dynamic> item, double photoHeight) => InkWell(
    borderRadius: BorderRadius.circular(20),
    onTap: () async {
      await context.push('/item/${item['id']}');
      if (mounted) load();
    },
    child: Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              ItemPhoto(item, height: photoHeight),
              Positioned(
                left: 10,
                bottom: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 11,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: item['price'] == 0
                        ? const Color(0xFF27AB48)
                        : const Color(0xDD282D2B),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Text(
                    money(item['price']),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
              if (item['saved'] == true)
                const Positioned(
                  top: 9,
                  right: 9,
                  child: CircleAvatar(
                    radius: 14,
                    backgroundColor: Colors.white,
                    child: Icon(Icons.bookmark, size: 16),
                  ),
                ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 10, 10, 0),
            child: Text(
              item['title'],
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 3, 10, 8),
            child: Text(
              item['status'] == 'draft'
                  ? 'Draft · Only visible to you'
                  : item['status'] == 'closed'
                  ? 'Closed'
                  : item['community'] ?? 'Your community',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: AppColors.muted, fontSize: 11),
            ),
          ),
        ],
      ),
    ),
  );
  Widget _propertyBanner() => Container(
    clipBehavior: Clip.antiAlias,
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(20),
      color: const Color(0xFFF3EFE3),
    ),
    child: Row(
      children: [
        Expanded(
          flex: 3,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'A NEW CHAPTER STARTS HERE',
                  style: TextStyle(
                    color: Color(0xFF287B9B),
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'Find a home.\nFind your people.',
                  style: TextStyle(
                    fontSize: 24,
                    height: 1.2,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: newItem,
                  child: const Text('Post Property →'),
                ),
              ],
            ),
          ),
        ),
        const Expanded(
          flex: 2,
          child: ItemPhoto({'image_asset': 'house'}, height: 224),
        ),
      ],
    ),
  );
  Widget _servicesBanner() => Container(
    padding: const EdgeInsets.all(25),
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(22),
      gradient: const LinearGradient(
        colors: [Color(0xFFF9E8AF), Color(0xFFC8E1E5)],
      ),
    ),
    child: Row(
      children: [
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Big plans.\nA little help.',
                style: TextStyle(
                  fontSize: 29,
                  fontWeight: FontWeight.w800,
                  height: 1.2,
                ),
              ),
              SizedBox(height: 13),
              Text(
                'Services that make home\nfeel a little more like home.',
                style: TextStyle(height: 1.7),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: .6),
            borderRadius: BorderRadius.circular(24),
          ),
          child: const Icon(
            Icons.home_repair_service_outlined,
            size: 58,
            color: AppColors.coral,
          ),
        ),
      ],
    ),
  );
}

class ItemDetailScreen extends ConsumerStatefulWidget {
  const ItemDetailScreen({super.key, required this.id});
  final String id;
  @override
  ConsumerState<ItemDetailScreen> createState() => _ItemDetailScreenState();
}

class _ItemDetailScreenState extends ConsumerState<ItemDetailScreen> {
  Map<String, dynamic>? item;
  String? error;
  bool busy = false;
  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final result = await ref
          .read(contentRepositoryProvider)
          .detail(widget.id);
      if (mounted) {
        setState(() {
          item = result;
          error = null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => error = friendlyError(e));
    }
  }

  Future<bool> act(String name, [Map<String, dynamic>? data]) async {
    setState(() => busy = true);
    try {
      await ref.read(contentRepositoryProvider).action(widget.id, name, data);
      await load();
      return true;
    } catch (e) {
      if (mounted) showToast(context, friendlyError(e));
      return false;
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> message(bool comment) async {
    final text = await askMessage(
      context,
      comment ? 'Add your comment' : 'Send an enquiry',
    );
    if (text == null || !mounted) return;
    final success = await act(comment ? 'comments' : 'inquiries', {
      'message': text,
    });
    if (mounted && !comment && success) {
      showToast(context, 'Enquiry sent. View replies in your activity.');
    }
  }

  Future<void> book() async {
    final repo = ref.read(contentRepositoryProvider);
    if (repo.homes.isEmpty) {
      showToast(context, 'An approved home membership is required.');
      return;
    }
    final date = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 180)),
    );
    if (date == null || !mounted) return;
    final note = await askMessage(
      context,
      'Service requirements',
      hint: 'Tell the team what you need',
    );
    if (note == null || !mounted) return;
    final success = await act('requests', {
      'unit_id': repo.homes.values.first,
      'scheduled_on': DateFormat('yyyy-MM-dd').format(date),
      'note': note,
    });
    if (mounted && success) {
      showToast(
        context,
        'Request submitted. The society team will confirm availability.',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final i = item;
    return AppPage(
      maxWidth: 820,
      children: [
        TextButton.icon(
          onPressed: () => context.canPop() ? context.pop() : context.go('/'),
          icon: const Icon(Icons.arrow_back),
          label: const Text('Back'),
        ),
        if (error != null)
          EmptyState(
            title: 'Unable to open item',
            message: error!,
            action: TextButton(onPressed: load, child: const Text('Retry')),
          )
        else if (i == null)
          const Center(child: CircularProgressIndicator())
        else ...[
          if (!['post', 'notice'].contains(i['kind']))
            ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: ItemPhoto(i, height: 285),
            ),
          const SizedBox(height: 20),
          Surface(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        i['title'],
                        style: const TextStyle(
                          fontSize: 25,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    IconButton(
                      tooltip: 'Save item',
                      onPressed: busy ? null : () => act('bookmark'),
                      icon: Icon(
                        i['saved'] == true
                            ? Icons.bookmark
                            : Icons.bookmark_border,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (!['post', 'notice'].contains(i['kind']))
                  Text(
                    '${money(i['price'])}${i['listing_type'] == 'rent' ? ' / month' : ''}',
                    style: const TextStyle(
                      fontSize: 23,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                const SizedBox(height: 12),
                Text(
                  '${i['author']} · ${i['community']}',
                  style: const TextStyle(color: AppColors.muted),
                ),
                if (i['unit'] != null)
                  Text(
                    '${i['unit']}${i['bedrooms'] != null ? ' · ${i['bedrooms']} BHK' : ''}',
                    style: const TextStyle(color: AppColors.muted),
                  ),
                const SizedBox(height: 22),
                Text(
                  i['description'] ?? '',
                  style: const TextStyle(fontSize: 15, height: 1.8),
                ),
                const SizedBox(height: 22),
                if (i['author_id'] ==
                    ref.read(contentRepositoryProvider).userId)
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      if (i['status'] != 'published')
                        FilledButton(
                          onPressed: busy
                              ? null
                              : () => act('status', {'status': 'published'}),
                          child: const Text('Publish listing'),
                        ),
                      if (i['status'] == 'published')
                        OutlinedButton(
                          onPressed: busy
                              ? null
                              : () => act('status', {'status': 'closed'}),
                          child: Text(
                            i['kind'] == 'post'
                                ? 'Close post'
                                : 'Mark unavailable',
                          ),
                        ),
                    ],
                  )
                else if (i['status'] == 'published')
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: busy
                          ? null
                          : i['kind'] == 'service'
                          ? book
                          : () =>
                                message(['post', 'notice'].contains(i['kind'])),
                      icon: Icon(
                        i['kind'] == 'service'
                            ? Icons.calendar_month_outlined
                            : Icons.chat_bubble_outline,
                      ),
                      label: Text(
                        i['kind'] == 'service'
                            ? 'Request a service'
                            : ['post', 'notice'].contains(i['kind'])
                            ? 'Add a comment'
                            : 'Contact seller',
                      ),
                    ),
                  ),
                if (i['kind'] == 'service')
                  const Padding(
                    padding: EdgeInsets.only(top: 14),
                    child: Text(
                      'This is a booking request. Your society team confirms the date and final price. No payment is collected here.',
                      style: TextStyle(
                        color: AppColors.muted,
                        fontSize: 12,
                        height: 1.6,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (['post', 'notice'].contains(i['kind'])) ...[
            const SizedBox(height: 20),
            const SectionTitle('Conversation'),
            for (final c in (i['comments'] ?? []) as List)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Surface(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        c['author'],
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 8),
                      Text(c['body'], style: const TextStyle(height: 1.6)),
                    ],
                  ),
                ),
              ),
          ],
        ],
      ],
    );
  }
}

Future<String?> askMessage(
  BuildContext context,
  String title, {
  String hint = 'Write your message',
}) => showDialog<String>(
  context: context,
  builder: (_) => _MessageDialog(title: title, hint: hint),
);

class _MessageDialog extends StatefulWidget {
  const _MessageDialog({required this.title, required this.hint});
  final String title, hint;
  @override
  State<_MessageDialog> createState() => _MessageDialogState();
}

class _MessageDialogState extends State<_MessageDialog> {
  final controller = TextEditingController();
  final form = GlobalKey<FormState>();
  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: Text(widget.title),
    content: Form(
      key: form,
      child: TextFormField(
        controller: controller,
        autofocus: true,
        maxLines: 4,
        maxLength: 1000,
        decoration: InputDecoration(hintText: widget.hint),
        validator: (v) =>
            (v?.trim().length ?? 0) < 2 ? 'Please enter a message' : null,
      ),
    ),
    actions: [
      TextButton(
        onPressed: () => Navigator.pop(context),
        child: const Text('Cancel'),
      ),
      FilledButton(
        onPressed: () {
          if (form.currentState!.validate()) {
            Navigator.pop(context, controller.text.trim());
          }
        },
        child: const Text('Send'),
      ),
    ],
  );
}

class NewItemScreen extends ConsumerStatefulWidget {
  const NewItemScreen({super.key, required this.kind});
  final String kind;
  @override
  ConsumerState<NewItemScreen> createState() => _NewItemScreenState();
}

class _NewItemScreenState extends ConsumerState<NewItemScreen> {
  final form = GlobalKey<FormState>();
  final title = TextEditingController(),
      description = TextEditingController(),
      price = TextEditingController(text: '0');
  String category = 'Furniture', listingType = 'rent', asset = 'chair';
  String? unit;
  DateTime? date;
  int bedrooms = 2;
  bool busy = false, preview = false;
  String? photo;
  @override
  void initState() {
    super.initState();
    if (widget.kind == 'property') {
      category = 'Rent';
      asset = 'house';
    }
    if (widget.kind == 'post') {
      category = 'Community';
      asset = 'community';
    }
    unit = ref.read(contentRepositoryProvider).homes.values.firstOrNull;
  }

  @override
  void dispose() {
    title.dispose();
    description.dispose();
    price.dispose();
    super.dispose();
  }

  Future<void> save(bool draft) async {
    if (!form.currentState!.validate()) return;
    if (widget.kind == 'property' && (date == null || unit == null)) {
      showToast(context, 'Select your property and available date.');
      return;
    }
    setState(() => busy = true);
    try {
      await ref.read(contentRepositoryProvider).create({
        'kind': widget.kind,
        'title': title.text.trim(),
        'description': description.text.trim(),
        'price': int.tryParse(price.text) ?? 0,
        'category': widget.kind == 'property'
            ? (listingType == 'rent' ? 'Rent' : 'Buy')
            : category,
        'image_asset': asset,
        'photo_base64': ?photo,
        'status': draft ? 'draft' : 'published',
        if (widget.kind == 'property') ...{
          'unit_id': unit,
          'listing_type': listingType,
          'bedrooms': bedrooms,
          'available_on': DateFormat('yyyy-MM-dd').format(date!),
        },
      });
      if (mounted) {
        showToast(
          context,
          draft
              ? 'Draft saved. Find it in My listings.'
              : 'Your post is published.',
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) showToast(context, friendlyError(e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => AppPage(
    maxWidth: 700,
    children: [
      TextButton.icon(
        onPressed: () => context.pop(),
        icon: const Icon(Icons.arrow_back),
        label: const Text('Back'),
      ),
      PageHeading(
        widget.kind == 'property'
            ? 'Post your property'
            : widget.kind == 'post'
            ? 'New community post'
            : 'New listing',
        'A little detail helps your neighbours find what they need.',
      ),
      if (widget.kind == 'property')
        const Padding(
          padding: EdgeInsets.only(bottom: 18),
          child: Surface(
            color: Color(0xFFE6F2FD),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Color(0xFF287B9B)),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Only properties linked to your approved owner membership can be listed.',
                  ),
                ),
              ],
            ),
          ),
        ),
      Surface(
        child: Form(
          key: form,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (widget.kind == 'property') ...[
                const Label('Select the property'),
                DropdownButtonFormField<String>(
                  initialValue: unit,
                  items: ref
                      .read(contentRepositoryProvider)
                      .homes
                      .entries
                      .map(
                        (e) => DropdownMenuItem(
                          value: e.value,
                          child: Text(e.key),
                        ),
                      )
                      .toList(),
                  onChanged: (v) => setState(() => unit = v),
                  validator: (v) =>
                      v == null ? 'An approved home is required' : null,
                ),
                const Label('Listing type'),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'rent', label: Text('Rent out')),
                    ButtonSegment(value: 'sell', label: Text('Sell')),
                  ],
                  selected: {listingType},
                  onSelectionChanged: (v) =>
                      setState(() => listingType = v.first),
                ),
                const Label('Available from'),
                OutlinedButton.icon(
                  onPressed: () async {
                    final value = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now(),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 730)),
                    );
                    if (value != null) setState(() => date = value);
                  },
                  icon: const Icon(Icons.calendar_today_outlined),
                  label: Text(
                    date == null
                        ? 'Select move-in date'
                        : DateFormat.yMMMd().format(date!),
                  ),
                ),
                const Label('Bedrooms'),
                DropdownButtonFormField<int>(
                  initialValue: bedrooms,
                  items: [
                    for (var n = 1; n <= 6; n++)
                      DropdownMenuItem(value: n, child: Text('$n BHK')),
                  ],
                  onChanged: (v) => bedrooms = v!,
                ),
              ],
              const Label('Title'),
              TextFormField(
                controller: title,
                maxLength: 120,
                decoration: const InputDecoration(
                  hintText: 'Give your post a clear title',
                ),
                validator: (v) => (v?.trim().length ?? 0) < 3
                    ? 'Enter at least 3 characters'
                    : null,
              ),
              const Label('Description'),
              TextFormField(
                controller: description,
                maxLines: 5,
                maxLength: 3000,
                decoration: const InputDecoration(
                  hintText: 'Condition, features, location and anything useful',
                ),
                validator: (v) => (v?.trim().length ?? 0) < 3
                    ? 'Add a short description'
                    : null,
              ),
              if (widget.kind != 'post') ...[
                const Label('Price in rupees (0 for free)'),
                TextFormField(
                  controller: price,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(prefixText: '₹ '),
                  validator: (v) {
                    final n = int.tryParse(v ?? '');
                    return n == null || n < 0 || n > 2000000000
                        ? 'Enter a valid whole-rupee price'
                        : null;
                  },
                ),
                if (widget.kind == 'listing') ...[
                  const Label('Category'),
                  DropdownButtonFormField<String>(
                    initialValue: category,
                    items: categories
                        .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                        .toList(),
                    onChanged: (v) => category = v!,
                  ),
                ],
                const Label('Cover image'),
                OutlinedButton.icon(
                  onPressed: () async {
                    try {
                      final selected = await ImagePicker().pickImage(
                        source: ImageSource.gallery,
                        imageQuality: 80,
                        maxWidth: 1400,
                      );
                      if (selected == null) return;
                      final bytes = await selected.readAsBytes();
                      if (bytes.length > 2 * 1024 * 1024) {
                        throw StateError('Choose a photo smaller than 2 MB.');
                      }
                      if (mounted) setState(() => photo = base64Encode(bytes));
                    } catch (e) {
                      if (context.mounted) showToast(context, friendlyError(e));
                    }
                  },
                  icon: const Icon(Icons.add_photo_alternate_outlined),
                  label: Text(
                    photo == null ? 'Upload your photo' : 'Replace photo',
                  ),
                ),
                if (photo != null) ...[
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(15),
                    child: Image.memory(
                      base64Decode(photo!),
                      height: 180,
                      width: double.infinity,
                      fit: BoxFit.cover,
                    ),
                  ),
                  TextButton(
                    onPressed: () => setState(() => photo = null),
                    child: const Text('Remove photo'),
                  ),
                ],
                DropdownButtonFormField<String>(
                  initialValue: asset,
                  items:
                      [
                            'house',
                            'chair',
                            'sofa',
                            'car',
                            'decor',
                            'bicycle',
                            'community',
                          ]
                          .map(
                            (a) => DropdownMenuItem(
                              value: a,
                              child: Text(a[0].toUpperCase() + a.substring(1)),
                            ),
                          )
                          .toList(),
                  onChanged: (v) => setState(() => asset = v!),
                ),
                const Padding(
                  padding: EdgeInsets.only(top: 8),
                  child: Text(
                    'Choose an illustrative cover for your listing.',
                    style: TextStyle(color: AppColors.muted, fontSize: 11),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              if (preview) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: ItemPhoto({'image_asset': asset}),
                ),
                const SizedBox(height: 12),
                Text(
                  title.text,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(description.text),
                const SizedBox(height: 20),
              ],
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  OutlinedButton(
                    onPressed: busy ? null : () => save(true),
                    child: const Text('Save draft'),
                  ),
                  OutlinedButton(
                    onPressed: () {
                      if (form.currentState!.validate()) {
                        setState(() => preview = !preview);
                      }
                    },
                    child: Text(preview ? 'Hide preview' : 'Preview'),
                  ),
                  FilledButton(
                    onPressed: busy ? null : () => save(false),
                    child: Text(busy ? 'Saving…' : 'Publish'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 30),
    ],
  );
}

class ActivityScreen extends ConsumerStatefulWidget {
  const ActivityScreen({super.key});
  @override
  ConsumerState<ActivityScreen> createState() => _ActivityScreenState();
}

class _ActivityScreenState extends ConsumerState<ActivityScreen> {
  List<dynamic> rows = [];
  int requestVersion = 0;
  String tab = 'requests';
  String? error;
  bool loading = true;
  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    final version = ++requestVersion;
    setState(() => loading = true);
    try {
      final result = await ref.read(contentRepositoryProvider).activity(tab);
      if (mounted && version == requestVersion) {
        setState(() {
          rows = result;
          error = null;
          loading = false;
        });
      }
    } catch (e) {
      if (mounted && version == requestVersion) {
        setState(() {
          error = friendlyError(e);
          loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => AppPage(
    maxWidth: 800,
    children: [
      TextButton.icon(
        onPressed: () => context.canPop() ? context.pop() : context.go('/'),
        icon: const Icon(Icons.arrow_back),
        label: const Text('Back'),
      ),
      const PageHeading(
        'Your activity',
        'Service requests, listing enquiries and replies.',
      ),
      SegmentedButton<String>(
        segments: const [
          ButtonSegment(value: 'requests', label: Text('Requests')),
          ButtonSegment(value: 'inquiries', label: Text('Enquiries')),
        ],
        selected: {tab},
        onSelectionChanged: (v) {
          setState(() => tab = v.first);
          load();
        },
      ),
      const SizedBox(height: 22),
      if (loading)
        const Center(child: CircularProgressIndicator())
      else if (error != null)
        EmptyState(
          title: 'Couldn’t load activity',
          message: error!,
          action: TextButton(onPressed: load, child: const Text('Retry')),
        )
      else if (rows.isEmpty)
        const Surface(
          child: EmptyState(
            title: 'Nothing here yet',
            message:
                'Your service requests and listing conversations will appear here.',
          ),
        )
      else
        for (final row in rows)
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Surface(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    row['title'],
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 9),
                  if (tab == 'requests') ...[
                    Text(
                      '${row['unit']} · ${row['scheduled_on'].toString().substring(0, 10)}',
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Status: ${row['status']}',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    if (['requested', 'accepted'].contains(row['status']))
                      TextButton(
                        onPressed: () async {
                          try {
                            await ref
                                .read(contentRepositoryProvider)
                                .cancel(row['id']);
                            await load();
                          } catch (e) {
                            if (context.mounted) {
                              showToast(context, friendlyError(e));
                            }
                          }
                        },
                        child: const Text('Cancel request'),
                      ),
                  ] else ...[
                    Text(
                      '${row['sender']} → ${row['recipient']}',
                      style: const TextStyle(color: AppColors.muted),
                    ),
                    const SizedBox(height: 9),
                    Text(row['message']),
                    if (row['reply'] != null) ...[
                      const Divider(height: 25),
                      Text('Reply: ${row['reply']}'),
                    ],
                    if (row['recipient_id'] ==
                        ref.read(contentRepositoryProvider).userId)
                      TextButton(
                        onPressed: () async {
                          final text = await askMessage(
                            context,
                            'Reply to enquiry',
                          );
                          if (text == null) return;
                          try {
                            await ref
                                .read(contentRepositoryProvider)
                                .reply(row['id'], text);
                            await load();
                          } catch (e) {
                            if (context.mounted) {
                              showToast(context, friendlyError(e));
                            }
                          }
                        },
                        child: const Text('Reply'),
                      ),
                  ],
                ],
              ),
            ),
          ),
    ],
  );
}

class CommunityPosts extends ConsumerStatefulWidget {
  const CommunityPosts({super.key});
  @override
  ConsumerState<CommunityPosts> createState() => _CommunityPostsState();
}

class _CommunityPostsState extends ConsumerState<CommunityPosts> {
  List<dynamic> posts = [];
  String? error;
  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final data = await ref.read(contentRepositoryProvider).list('post');
      if (mounted) setState(() => posts = data['items']);
    } catch (e) {
      if (mounted) setState(() => error = friendlyError(e));
    }
  }

  @override
  Widget build(BuildContext context) => Column(
    children: [
      SectionTitle(
        'Community Posts',
        action: 'New Post',
        onTap: () async {
          await context.push('/new-item/post');
          if (mounted) load();
        },
      ),
      const SizedBox(height: 14),
      if (error != null)
        TextButton(
          onPressed: load,
          child: const Text('Reload community posts'),
        ),
      for (final p in posts.take(5))
        Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Surface(
            radius: 24,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: const Color(0xFF8AA76D),
                      child: Text(
                        (p['author'] as String)[0],
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            p['author'],
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                            ),
                          ),
                          Text(
                            p['community'],
                            style: const TextStyle(
                              color: AppColors.muted,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.lock_outline, size: 14),
                  ],
                ),
                const SizedBox(height: 18),
                Text(
                  p['description'],
                  style: const TextStyle(fontSize: 14, height: 1.55),
                ),
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: () async {
                    await context.push('/item/${p['id']}');
                    if (mounted) load();
                  },
                  child: Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Add your thoughts…',
                          style: TextStyle(color: AppColors.muted),
                        ),
                      ),
                      const Icon(Icons.send_outlined, size: 19),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${p['comment_count'] ?? 0} comments',
                  style: const TextStyle(color: AppColors.muted, fontSize: 11),
                ),
              ],
            ),
          ),
        ),
    ],
  );
}
�s